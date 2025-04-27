export interface PollOption {
  id: string;
  text: string;
  votes: number;
}

export interface PollResult {
  question: string;
  options: PollOption[];
  totalVotes: number;
  hasVoted: boolean;
}

export type PollData = {
  question: string;
  options: {
    id: string;
    text: string;
  }[];
};
