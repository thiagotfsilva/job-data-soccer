interface Season {
  id: number;
  startDate: Date;
  endDate: Date;
  currentMatch: number;
  winner: string;
  stage: string;
}

export default Season;