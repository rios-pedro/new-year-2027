export type RsvpStatus = 'pending' | 'confirmed' | 'declined'

export type Guest = {
  id: string
  name: string
  rsvp_status: RsvpStatus
}

export type Contribution = {
  id?: string
  guest_id?: string
  food_and_drinks: string | null
  board_games: string | null
}

export type GuestContribution = Pick<Guest, 'id' | 'name'> & {
  contributions: Contribution | Contribution[] | null
}
