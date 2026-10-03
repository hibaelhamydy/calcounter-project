import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import CalorieRing from './CalorieRing'

describe('CalorieRing', () => {
  it('shows calories remaining when under the goal', () => {
    render(<CalorieRing total={1200} goal={2000} entries={[]} />)
    expect(screen.getByText('800')).toBeInTheDocument()
    expect(screen.getByText('cal left')).toBeInTheDocument()
    expect(screen.getByText('1,200 of 2,000')).toBeInTheDocument()
  })

  it('switches to an "over goal" state once total exceeds goal', () => {
    render(<CalorieRing total={2300} goal={2000} entries={[]} />)
    expect(screen.getByText('300')).toBeInTheDocument()
    expect(screen.getByText('cal over')).toBeInTheDocument()
  })

  it('falls back to a plain logged-calories display with no goal set', () => {
    render(<CalorieRing total={450} goal={0} entries={[]} />)
    expect(screen.getByText('450')).toBeInTheDocument()
    expect(screen.getByText('cal logged')).toBeInTheDocument()
    expect(screen.getByText('Set a goal to see the ring fill')).toBeInTheDocument()
  })

  it('builds a legend from entries, aggregated and sorted by category total', () => {
    render(
      <CalorieRing
        total={300}
        goal={2000}
        entries={[
          { category: 'breakfast', calories: 100, servings: 1 },
          { category: 'lunch', calories: 100, servings: 2 },
        ]}
      />,
    )
    // Lunch (200) should be listed before breakfast (100) - sorted descending.
    const legendItems = screen.getAllByRole('listitem')
    expect(legendItems).toHaveLength(2)
    expect(legendItems[0]).toHaveTextContent('lunch')
    expect(legendItems[1]).toHaveTextContent('breakfast')
  })

  it('omits the legend entirely when there are no entries', () => {
    render(<CalorieRing total={0} goal={2000} entries={[]} />)
    expect(screen.queryByRole('list')).not.toBeInTheDocument()
  })

  it('exposes an accessible label summarizing progress for screen readers', () => {
    render(<CalorieRing total={1500} goal={2000} entries={[]} />)
    expect(screen.getByRole('img', { name: '1500 of 2000 calories, 500 remaining' })).toBeInTheDocument()
  })
})
