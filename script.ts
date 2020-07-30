const MatchVars = {
  players: 10,
  balls: 6,
  time: 60,
  runs: [0, 1, 2, 4, 6],
  startTeam: 1,
  mom: { name: "player1", score: 0, team: "Team 1" },
};

let url = new URL(window.location.href);
MatchVars.players = parseInt(url.searchParams.get("players"))
  ? parseInt(url.searchParams.get("players"))
  : MatchVars.players;
MatchVars.time = parseInt(url.searchParams.get("time"))
  ? parseInt(url.searchParams.get("time"))
  : MatchVars.time;
MatchVars.startTeam = parseInt(url.searchParams.get("team"))
  ? parseInt(url.searchParams.get("team"))
  : MatchVars.startTeam;

class ScoreTable {
  name: string;
  parentId: string;
  players: number = MatchVars.players;
  balls: number = MatchVars.balls;
  tableHtml: HTMLTableElement;
  cellPos: number[] = [1, 1];
  playerObjs: Player[] = [];
  battingOver: boolean = false;
  scoreBoardId: string;

  constructor(name: string, parentId: string, scoreBoardId: string) {
    this.name = name;
    this.parentId = parentId;
    this.scoreBoardId = scoreBoardId;
    this.tableHtml = <HTMLTableElement>document.createElement("table");
    this.tableHtml.className = "table table-dark";
    this.tableHtml.appendChild(this.createHead());
    this.tableHtml.appendChild(this.createBody());
    document.getElementById(this.parentId).appendChild(this.tableHtml);
  }
  private createHead(): HTMLTableSectionElement {
    let head = <HTMLTableSectionElement>document.createElement("thead");
    let headRow = document.createElement("tr");
    let headCell = <HTMLTableHeaderCellElement>document.createElement("th");
    headCell.innerHTML = this.name;
    headRow.appendChild(headCell);
    for (let ballNo = 1; ballNo <= this.balls; ballNo++) {
      headCell = document.createElement("th");
      headCell.scope = "col";
      headCell.innerHTML = `B${ballNo}`;
      headRow.appendChild(headCell);
    }
    headCell = document.createElement("th");
    headCell.innerHTML = "TOTAL";
    headRow.appendChild(headCell);
    head.appendChild(headRow);
    return head;
  }
  private createBody(): HTMLTableSectionElement {
    let body = <HTMLTableSectionElement>document.createElement("tbody");
    let bodyRow;
    let headCell: HTMLTableHeaderCellElement;
    for (let playerNo = 1; playerNo <= this.players; playerNo++) {
      this.playerObjs.push(new Player());
      bodyRow = document.createElement("tr");
      headCell = document.createElement("th");
      headCell.scope = "row";
      headCell.innerHTML = `Player ${playerNo}`;
      bodyRow.appendChild(headCell);
      let dataCell: HTMLTableDataCellElement;
      for (let ballNo = 1; ballNo <= this.balls; ballNo++) {
        dataCell = document.createElement("td");
        dataCell.id = `${this.name}P${playerNo}B${ballNo}`;
        bodyRow.appendChild(dataCell);
      }
      dataCell = document.createElement("td");
      dataCell.id = `${this.name}P${playerNo}Total`;
      bodyRow.appendChild(dataCell);
      body.appendChild(bodyRow);
    }
    return body;
  }
  hit(runs = "1"): void {
    if (this.battingOver) return;
    let cellid = `${this.name}P${this.cellPos[0]}B${this.cellPos[1]}`;
    // console.log(cellid);
    document.getElementById(cellid).innerHTML = runs != "0" ? runs : "out";
    const updateScores = () => {
      let currentPlayer = this.playerObjs[this.cellPos[0] - 1];

      currentPlayer.runs.push(parseInt(runs));
      if (MatchVars.mom.score < currentPlayer.getTotal()) {
        //selecting mom
        MatchVars.mom.name = `Player${this.cellPos[0]}`;
        MatchVars.mom.score = currentPlayer.getTotal();
        MatchVars.mom.team = this.name;
      }
      cellid = `${this.name}P${this.cellPos[0]}Total`;
      document.getElementById(
        cellid
      ).innerHTML = currentPlayer.getTotal().toString();
      document.getElementById(
        this.scoreBoardId
      ).innerHTML = this.getTotal().toString();
    };
    updateScores();

    const nextCell = () => {
      this.cellPos[1]++;
      if (runs == "0" || this.cellPos[1] > MatchVars.balls) {
        this.cellPos[0]++;
        this.cellPos[1] = 1;
      }
      if (this.cellPos[0] > MatchVars.players) {
        this.battingOver = true;
      }
    };
    nextCell();
  }
  getTotal(): number {
    return this.playerObjs.reduce((t, p) => t + p.getTotal(), 0);
  }
}

class Player {
  runs: number[] = [];
  constructor() {}
  getTotal(): number {
    return this.runs.reduce((t, r) => r + t, 0);
  }
}

class GameManager {
  playedTeams: number = 0;
  randomRun: number = 1;
  team: number;
  timeGen: number;
  randomRunsGen: number;
  team1: ScoreTable;
  team2: ScoreTable;
  constructor(team1: ScoreTable, team2: ScoreTable) {
    this.team = MatchVars.startTeam;
    this.team1 = team1;
    this.team2 = team2;
    this.playTeam();
  }
  playTeam(): void {
    let getResultsBtn = <HTMLButtonElement>(
      document.getElementById("matchresultbtn")
    );
    let team1Btn = <HTMLButtonElement>document.getElementById("team1hitbtn");
    let team2Btn = <HTMLButtonElement>document.getElementById("team2hitbtn");
    if (this.playedTeams == 2) {
      document.getElementById("roundStatus").innerText = "Match Ended";
      document.getElementById("roundStatus").className = "h3 bg-danger";
      clearInterval(this.timeGen);
      clearInterval(this.randomRunsGen);
      getResultsBtn.disabled = false;
      team1Btn.disabled = true;
      team2Btn.disabled = true;
      return;
    } else {
      if (this.playedTeams == 1) this.team = this.team == 1 ? 2 : 1;
      this.playedTeams++;
      clearInterval(this.timeGen);
      clearInterval(this.randomRunsGen);
      this.startRandomRuns();
      this.startTimer();
    }

    if (this.team == 1) {
      document.getElementById("roundStatus").innerText = "Team 1 on strike";
      document.getElementById("roundStatus").className = "h3 bg-success";
      getResultsBtn.disabled = true;
      team1Btn.disabled = false;
      team2Btn.disabled = true;
    }
    if (this.team == 2) {
      document.getElementById("roundStatus").innerText = "Team 2 on strike";
      document.getElementById("roundStatus").className = "h3 bg-warning";
      getResultsBtn.disabled = true;
      team1Btn.disabled = true;
      team2Btn.disabled = false;
    }
  }
  private startRandomRuns(): void {
    let randomNumDisp = document.getElementById("randomRun");
    this.randomRunsGen = setInterval(() => {
      this.randomRun =
        MatchVars.runs[Math.floor(Math.random() * MatchVars.runs.length)];
      randomNumDisp.innerText = this.randomRun.toString();
    }, 100);
  }
  private startTimer(): void {
    let timerDisp = document.getElementById("timer");
    let startTime = MatchVars.time;
    timerDisp.innerText = (startTime--).toString();
    this.timeGen = setInterval(() => {
      timerDisp.innerText = (startTime--).toString();
      if (startTime <= -1) {
        let playingteam = this.team == 1 ? team1Table : team2Table;
        playingteam.battingOver = true;
        this.playTeam();
      }
    }, 1000);
  }
  hit(): void {
    let playingteam = this.team == 1 ? this.team1 : this.team2;
    playingteam.hit(this.randomRun.toString());
    if (this.playedTeams == 2) {
      let playedteam = this.team == 1 ? this.team2 : this.team1;
      if (playedteam.getTotal() < playingteam.getTotal()) {
        playingteam.battingOver = true;
        GameManagerNew.playTeam();
        return;
      }
    }
    if (playingteam.battingOver) {
      GameManagerNew.playTeam();
    }
  }
  result(): string {
    if (this.team1.getTotal() > this.team2.getTotal()) {
      return "Team 1 has won";
    } else if (team1Table.getTotal() == team2Table.getTotal()) {
      return " This match is Draw";
    } else {
      return "Team 2 has won";
    }
  }
}

let team1Table = new ScoreTable("TEAM 1", "table-team1", "team1Total");
let team2Table = new ScoreTable("TEAM 2", "table-team2", "team2Total");
let GameManagerNew = new GameManager(team1Table, team2Table);

const hit = () => {
  GameManagerNew.hit();
};
const results = () => {
  let resultStr = GameManagerNew.result();
  window.open(
    `./game_results.html?result=${resultStr}&mom=${JSON.stringify(
      MatchVars.mom
    )}`,
    "_blank"
  );
};
