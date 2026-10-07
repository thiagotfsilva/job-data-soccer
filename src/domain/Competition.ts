enum CompetitionType {
  LEAGUE = "LEAGUE",
  LEAGUE_CUP = "LEAGUE_CUP",
  CUP = "CUP",
  PLAYOFFS = "PLAYOFFS",
}

interface Competition {
  id: number;
  name: string;
  code: string;
  type: CompetitionType;
  emblem: string;
  areaId: number;
  currentSeasonId: number;
}

export default Competition;
