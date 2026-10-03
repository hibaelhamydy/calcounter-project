import { beforeEach, describe, expect, it, vi } from 'vitest'

// calorieLog.js imports `db` from ./firebase, which calls initializeApp()
// against real Firebase config at module load time - something a unit test
// must never do. Both modules are mocked so the module under test loads
// cleanly and we can drive `onSnapshot` by hand instead of talking to a
// real (or emulated) Firestore.
vi.mock('./firebase', () => ({ db: {} }))

const onSnapshotCallbacks = {}

vi.mock('firebase/firestore', () => ({
  collection: (_db, _usersSegment, _uid, _logsSegment, date) => ({ __date: date }),
  doc: (...args) => ({ __path: args }),
  query: (ref) => ref,
  orderBy: () => undefined,
  onSnapshot: (ref, onNext) => {
    onSnapshotCallbacks[ref.__date] = onNext
    return () => {
      delete onSnapshotCallbacks[ref.__date]
    }
  },
  addDoc: vi.fn().mockResolvedValue({ id: 'new-entry' }),
  deleteDoc: vi.fn().mockResolvedValue(undefined),
  setDoc: vi.fn().mockResolvedValue(undefined),
  serverTimestamp: () => 'SERVER_TIMESTAMP',
}))

const { addLogEntry, dateKeysBack, subscribeToDailyTotals, todayKey } = await import('./calorieLog')
const { addDoc } = await import('firebase/firestore')

function fakeSnapshot(entries) {
  return { docs: entries.map((data) => ({ data: () => data })) }
}

describe('dateKeysBack', () => {
  it('returns `count` consecutive date keys, oldest first, ending at endDate', () => {
    const keys = dateKeysBack(3, new Date(2026, 0, 15))
    expect(keys).toEqual(['2026-01-13', '2026-01-14', '2026-01-15'])
  })

  it('returns a single-element array for count=1', () => {
    expect(dateKeysBack(1, new Date(2026, 0, 15))).toEqual(['2026-01-15'])
  })

  it('crosses a month boundary correctly', () => {
    expect(dateKeysBack(3, new Date(2026, 1, 1))).toEqual(['2026-01-30', '2026-01-31', '2026-02-01'])
  })
})

describe('todayKey', () => {
  it('returns a YYYY-MM-DD string', () => {
    expect(todayKey()).toMatch(/^\d{4}-\d{2}-\d{2}$/)
  })
})

describe('subscribeToDailyTotals', () => {
  beforeEach(() => {
    for (const key of Object.keys(onSnapshotCallbacks)) delete onSnapshotCallbacks[key]
  })

  it('sums calories * servings per date and buckets them by category', () => {
    const onChange = vi.fn()
    subscribeToDailyTotals('uid1', ['2026-01-01'], onChange)

    onSnapshotCallbacks['2026-01-01'](
      fakeSnapshot([
        { calories: 100, servings: 2, category: 'breakfast' },
        { calories: 50, servings: 1, category: 'lunch' },
        { calories: 10, servings: 3 }, // no category -> buckets under 'other'
      ]),
    )

    expect(onChange).toHaveBeenLastCalledWith({
      '2026-01-01': {
        total: 280,
        byCategory: { breakfast: 200, lunch: 50, other: 30 },
      },
    })
  })

  it('reports an independent total for each subscribed date', () => {
    const onChange = vi.fn()
    subscribeToDailyTotals('uid1', ['2026-01-01', '2026-01-02'], onChange)

    onSnapshotCallbacks['2026-01-01'](fakeSnapshot([{ calories: 100, servings: 1, category: 'dinner' }]))
    onSnapshotCallbacks['2026-01-02'](fakeSnapshot([{ calories: 200, servings: 1, category: 'dinner' }]))

    const last = onChange.mock.calls.at(-1)[0]
    expect(last['2026-01-01'].total).toBe(100)
    expect(last['2026-01-02'].total).toBe(200)
  })

  it('stops updating after unsubscribe is called', () => {
    const onChange = vi.fn()
    const unsubscribe = subscribeToDailyTotals('uid1', ['2026-01-01'], onChange)
    unsubscribe()

    expect(onSnapshotCallbacks['2026-01-01']).toBeUndefined()
  })
})

describe('addLogEntry', () => {
  it('stamps new entries with a server timestamp', async () => {
    await addLogEntry('uid1', '2026-01-01', { title: 'Oatmeal', calories: 150, servings: 1 })

    expect(addDoc).toHaveBeenCalledWith(
      { __date: '2026-01-01' },
      { title: 'Oatmeal', calories: 150, servings: 1, loggedAt: 'SERVER_TIMESTAMP' },
    )
  })
})
