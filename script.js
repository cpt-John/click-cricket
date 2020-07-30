var MatchVars = {
    players: 10,
    balls: 6,
    time: 60,
    runs: [0, 1, 2, 4, 6],
    startTeam: 1,
    mom: { name: "player1", score: 0, team: "Team 1" }
};
var url = new URL(window.location.href);
MatchVars.players = parseInt(url.searchParams.get("players"))
    ? parseInt(url.searchParams.get("players"))
    : MatchVars.players;
MatchVars.time = parseInt(url.searchParams.get("time"))
    ? parseInt(url.searchParams.get("time"))
    : MatchVars.time;
MatchVars.startTeam = parseInt(url.searchParams.get("team"))
    ? parseInt(url.searchParams.get("team"))
    : MatchVars.startTeam;
var ScoreTable = /** @class */ (function () {
    function ScoreTable(name, parentId, scoreBoardId) {
        this.players = MatchVars.players;
        this.balls = MatchVars.balls;
        this.cellPos = [1, 1];
        this.playerObjs = [];
        this.battingOver = false;
        this.name = name;
        this.parentId = parentId;
        this.scoreBoardId = scoreBoardId;
        this.tableHtml = document.createElement("table");
        this.tableHtml.className = "table table-dark";
        this.tableHtml.appendChild(this.createHead());
        this.tableHtml.appendChild(this.createBody());
        document.getElementById(this.parentId).appendChild(this.tableHtml);
    }
    ScoreTable.prototype.createHead = function () {
        var head = document.createElement("thead");
        var headRow = document.createElement("tr");
        var headCell = document.createElement("th");
        headCell.innerHTML = this.name;
        headRow.appendChild(headCell);
        for (var ballNo = 1; ballNo <= this.balls; ballNo++) {
            headCell = document.createElement("th");
            headCell.scope = "col";
            headCell.innerHTML = "B" + ballNo;
            headRow.appendChild(headCell);
        }
        headCell = document.createElement("th");
        headCell.innerHTML = "TOTAL";
        headRow.appendChild(headCell);
        head.appendChild(headRow);
        return head;
    };
    ScoreTable.prototype.createBody = function () {
        var body = document.createElement("tbody");
        var bodyRow;
        var headCell;
        for (var playerNo = 1; playerNo <= this.players; playerNo++) {
            this.playerObjs.push(new Player());
            bodyRow = document.createElement("tr");
            headCell = document.createElement("th");
            headCell.scope = "row";
            headCell.innerHTML = "Player " + playerNo;
            bodyRow.appendChild(headCell);
            var dataCell = void 0;
            for (var ballNo = 1; ballNo <= this.balls; ballNo++) {
                dataCell = document.createElement("td");
                dataCell.id = this.name + "P" + playerNo + "B" + ballNo;
                bodyRow.appendChild(dataCell);
            }
            dataCell = document.createElement("td");
            dataCell.id = this.name + "P" + playerNo + "Total";
            bodyRow.appendChild(dataCell);
            body.appendChild(bodyRow);
        }
        return body;
    };
    ScoreTable.prototype.hit = function (runs) {
        var _this = this;
        if (runs === void 0) { runs = "1"; }
        if (this.battingOver)
            return;
        var cellid = this.name + "P" + this.cellPos[0] + "B" + this.cellPos[1];
        // console.log(cellid);
        document.getElementById(cellid).innerHTML = runs != "0" ? runs : "out";
        var updateScores = function () {
            var currentPlayer = _this.playerObjs[_this.cellPos[0] - 1];
            currentPlayer.runs.push(parseInt(runs));
            if (MatchVars.mom.score < currentPlayer.getTotal()) {
                //selecting mom
                MatchVars.mom.name = "Player" + _this.cellPos[0];
                MatchVars.mom.score = currentPlayer.getTotal();
                MatchVars.mom.team = _this.name;
            }
            cellid = _this.name + "P" + _this.cellPos[0] + "Total";
            document.getElementById(cellid).innerHTML = currentPlayer.getTotal().toString();
            document.getElementById(_this.scoreBoardId).innerHTML = _this.getTotal().toString();
        };
        updateScores();
        var nextCell = function () {
            _this.cellPos[1]++;
            if (runs == "0" || _this.cellPos[1] > MatchVars.balls) {
                _this.cellPos[0]++;
                _this.cellPos[1] = 1;
            }
            if (_this.cellPos[0] > MatchVars.players) {
                _this.battingOver = true;
            }
        };
        nextCell();
    };
    ScoreTable.prototype.getTotal = function () {
        return this.playerObjs.reduce(function (t, p) { return t + p.getTotal(); }, 0);
    };
    return ScoreTable;
}());
var Player = /** @class */ (function () {
    function Player() {
        this.runs = [];
    }
    Player.prototype.getTotal = function () {
        return this.runs.reduce(function (t, r) { return r + t; }, 0);
    };
    return Player;
}());
var GameManager = /** @class */ (function () {
    function GameManager(team1, team2) {
        this.playedTeams = 0;
        this.randomRun = 1;
        this.team = MatchVars.startTeam;
        this.team1 = team1;
        this.team2 = team2;
        this.playTeam();
    }
    GameManager.prototype.playTeam = function () {
        var getResultsBtn = (document.getElementById("matchresultbtn"));
        var team1Btn = document.getElementById("team1hitbtn");
        var team2Btn = document.getElementById("team2hitbtn");
        if (this.playedTeams == 2) {
            document.getElementById("roundStatus").innerText = "Match Ended";
            document.getElementById("roundStatus").className = "h3 bg-danger";
            clearInterval(this.timeGen);
            clearInterval(this.randomRunsGen);
            getResultsBtn.disabled = false;
            team1Btn.disabled = true;
            team2Btn.disabled = true;
            return;
        }
        else {
            if (this.playedTeams == 1)
                this.team = this.team == 1 ? 2 : 1;
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
    };
    GameManager.prototype.startRandomRuns = function () {
        var _this = this;
        var randomNumDisp = document.getElementById("randomRun");
        this.randomRunsGen = setInterval(function () {
            _this.randomRun =
                MatchVars.runs[Math.floor(Math.random() * MatchVars.runs.length)];
            randomNumDisp.innerText = _this.randomRun.toString();
        }, 100);
    };
    GameManager.prototype.startTimer = function () {
        var _this = this;
        var timerDisp = document.getElementById("timer");
        var startTime = MatchVars.time;
        timerDisp.innerText = (startTime--).toString();
        this.timeGen = setInterval(function () {
            timerDisp.innerText = (startTime--).toString();
            if (startTime <= -1) {
                var playingteam = _this.team == 1 ? team1Table : team2Table;
                playingteam.battingOver = true;
                _this.playTeam();
            }
        }, 1000);
    };
    GameManager.prototype.hit = function () {
        var playingteam = this.team == 1 ? this.team1 : this.team2;
        playingteam.hit(this.randomRun.toString());
        if (this.playedTeams == 2) {
            var playedteam = this.team == 1 ? this.team2 : this.team1;
            if (playedteam.getTotal() < playingteam.getTotal()) {
                playingteam.battingOver = true;
                GameManagerNew.playTeam();
                return;
            }
        }
        if (playingteam.battingOver) {
            GameManagerNew.playTeam();
        }
    };
    GameManager.prototype.result = function () {
        if (this.team1.getTotal() > this.team2.getTotal()) {
            return "Team 1 has won";
        }
        else if (team1Table.getTotal() == team2Table.getTotal()) {
            return " This match is Draw";
        }
        else {
            return "Team 2 has won";
        }
    };
    return GameManager;
}());
var team1Table = new ScoreTable("TEAM 1", "table-team1", "team1Total");
var team2Table = new ScoreTable("TEAM 2", "table-team2", "team2Total");
var GameManagerNew = new GameManager(team1Table, team2Table);
var hit = function () {
    GameManagerNew.hit();
};
var results = function () {
    var resultStr = GameManagerNew.result();
    window.open("./game_results.html?result=" + resultStr + "&mom=" + JSON.stringify(MatchVars.mom), "_blank");
};
