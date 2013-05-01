//var gameApp = angular.module('gameApp', []);

function GameCtrl($scope, $location) {
  $scope.currentGame = 'tictactoe';
  $scope.game = Game.init(3,3,3,false);
  $scope.player1Name = 'Ned';
  $scope.player2Name = 'Joffrey';
  $scope.player1Control = "human";
  $scope.player2Control = "human";

  $scope.toggleControl = function(player){
    if(player == 1) {
      $scope.player1Control = ($scope.player1Control == 'human') ? 'computer' : 'human';
    }
    if(player == 2) {
      $scope.player2Control = ($scope.player2Control == 'human') ? 'computer' : 'human';
    }
    tryNextMove();
  }

  $scope.toggleGame = function() {
    switch($scope.currentGame){
    case 'tictactoe':
      $scope.currentGame = 'connectfour';
      $scope.game = Game.init(7, 6, 4, true); //Connect Four
      break
    default:
      $scope.currentGame = 'tictactoe';
      $scope.game = Game.init(3, 3, 3, false); //Tic Tac Toe
      break;
    }
  }

  $scope.reset = function() {
    $scope.game.reset();
    tryNextMove();
  }

  function automateTurn(){
    return ($scope.game.nextMove == 'O' && $scope.player2Control == 'computer') ||
    ($scope.game.nextMove == 'X' && $scope.player1Control == 'computer');
  }

  $scope.$watch('game.nextMove', function() {
    tryNextMove();
  });

  function tryNextMove() {
    if(automateTurn()) {
      $scope.game.playNextMove();
    }
  }

  $scope.winningMessage = function() {
    switch($scope.game.winner) {
    case "X":
      return "Ned Wins!";
    case "O":
      return "Joffrey Wins!";
    case "Draw":
      return "Draw!";
    default: 
      return "";
    }
  }

  $scope.winnerClass = function(val) {
    return $scope.game.winner == val ? 'winner' : ''
  }

  $scope.boardClass = function() {
    return ($scope.currentGame == 'tictactoe') ? 'standard' : 'sliding';
  }
}


(function() {
    this.Game = {
      init: function(columns, row, k, sliding) {
        return new InARowGame(columns, row, k, sliding);
      }
    }

    function InARowGame(columns, rows, k, sliding) {
      this.columns = columns;
      this.rows = rows;
      this.k = k;
      this.sliding = sliding;
      this.reset();
    }

    InARowGame.prototype.reset = function() {
      this.board = GU.initializeBoard(this.rows, this.columns);
      this.legalMoves = GU.calculateLegalMoves(this.board, this.sliding);
      this.nextMove = 'X';
      this.winner = '';
    }


    InARowGame.prototype.place = function(col, row) {
      var val = GU.translateMove(this.board, col, row, this.sliding),
      col = val[0];
      row = val[1];

      if(!this.winner && !GU.getBoardVal(col, row, this.board)) {
        GU.setBoardVal(col, row, this.board, this.nextMove);
        this.legalMoves = GU.calculateLegalMoves(this.board, this.sliding);
        if(GU.checkWinner(col, row, this.board, this.nextMove, this.k)) { 
          this.winner = this.nextMove;
          return; 
        }
        if(this.legalMoves.length == 0){
          this.winner = "Draw";
          return;
        }
        this.nextMove = (this.nextMove == "X") ? "O" : "X";
      }
    }

    InARowGame.prototype.playNextMove = function() {
      if(this.legalMoves.length > 0) {
        var maximize = (this.nextTurn == "O") ? true : false;
        var play = GU.minimax(maximize, $.extend(true, [], this.board), null, null, this.k, -999999, 999999, 0, this.sliding);
        this.place(play[1], play[2]);
      }
    }


    var GU = GameUtility = {
      initializeBoard: function(rows, columns) {
        var board = new Array(rows);
        for(var i=0; i < rows; i++){
          board[i] = new Array(columns);
          for(var j = 0; j < columns; j++){
            board[i][j] = '';
          }
        }
        return board;
      },

      calculateLegalMoves: function(board, sliding) {
        return (sliding ? GU.calculateSlidingLegalMoves(board) : GU.calculateNonSlidingLegalMoves(board));
      },

      calculateNonSlidingLegalMoves: function(board) {
        var legalMoves = [];
        for(i = 0; i < board.length; i++){ 
          for(j = 0; j < board[i].length; j++) {
            if(board[i][j] === '') {
              legalMoves.push([j,i]);
            }
          }
        }
        return legalMoves;
      },

      calculateSlidingLegalMoves: function(board) {
        var legalMoves = []
        for(var col = 0; col < board[0].length; col++) { //Columns
          for(var row = board.length - 1; row >= 0; row--) { //Rows
            if(GU.getBoardVal(col, row, board))
              continue;
            else {
              legalMoves.push([col, row]);
              break;
            }
          }
        } 
        return legalMoves;
      },

      getBoardVal: function(col, row, board) {
        return board[row][col];
      },


      setBoardVal: function(col, row, board, turn){
        board[row][col] = turn;
      },

      colWinner: function(col, row, board, turn, k) { 
        return GU.consecutiveCol(col, row, board, turn) >= k; 
      },

      consecutiveCol: function(col, row, board, turn) { 
        return 1 + GU.checkDelta(col, row-1, 0, -1, 0, board, turn) + GU.checkDelta(col, row+1, 0, 1, 0, board, turn);
      },


      diagWinner: function(col, row, board, turn, k) {
        return (Math.max(GU.consecutiveDiag(col, row, board, turn, true), GU.consecutiveDiag(col, row, board, turn, false)) >= k);
      },


      consecutiveDiag: function(col, row, board, turn, dir) {
        if(dir) {
          return 1 + GU.checkDelta(col-1, row-1, -1, -1, 0, board, turn) + GU.checkDelta(col+1, row+1, 1, 1, 0, board, turn); 
        }
        else {
          return 1 + GU.checkDelta(col+1, row-1, 1, -1, 0, board, turn) + GU.checkDelta(col-1, row+1, -1, 1, 0, board, turn); 
        }
      },

      checkDelta: function(col, row, dCol, dRow, count, board, turn) {
        if(GU.outsideBounds(col, row, board) || (GU.getBoardVal(col, row, board) != turn)) { return count; }
        return GU.checkDelta(col + dCol, row + dRow, dCol, dRow, count + 1, board, turn);
      },

      outsideBounds: function(col, row, board){
        if(row < 0 || row >= board.length) return true;
        if(col < 0 || col >= board[0].length) return true;
        return false;
      },

      translateMove: function(board, col, row, sliding) {
        if(sliding) {
          for(var i = board.length - 1; i >= 0; i--) {
            if(!GU.getBoardVal(col, i, board)) {
              return [col, i];
            }
          }
          return [col, board.length - 1];
        } else {
          return [col, row];
        }
      },

      rowWinner: function(col, row, board, turn, k) { 
        return (GU.consecutiveRow(col, row, board, turn) >= k); 
      },


      consecutiveRow: function(col, row, board, turn) { 
        return 1 + GU.checkDelta(col-1, row, -1, 0, 0, board, turn) + GU.checkDelta(col+1, row, 1, 0, 0, board, turn); 
      },

      checkWinner: function (col, row, board, turn, k) {
        return (GU.colWinner(col, row, board, turn, k) || 
        GU.rowWinner(col, row, board, turn, k) || 
        GU.diagWinner(col, row, board, turn, k));
      },

      minimax: function(maximize, board, lastCol, lastRow, k, alpha, beta, ply, sliding) { 
        var legalMoves = GU.calculateLegalMoves(board, sliding);
        if(legalMoves.length == 0) { 
          return [0, lastCol, lastRow]; //draw
        } 

        if(ply > 11) {
          return [0, lastCol, lastRow]; //score
        }

        var player = maximize ? 'O' : 'X';
        var nextPlayer = maximize ? 'X' : 'O';

        var bestMove = [0, 2, 2];
        var value = (maximize ? [-99999, lastCol, lastRow] : [99999, lastCol, lastRow]);
        for(var i = 0; i < legalMoves.length; i++) { 
          var move = legalMoves[i],
          col = move[0],
          row = move[1];
          GU.setBoardVal(col, row, board, player);
          if(GU.checkWinner(col, row, board, player, k)) {
            GU.setBoardVal(col, row, board, '');
            return (maximize ? [(-9999+ply), col, row] : [( 9999-ply), col, row])
          }
          var response = GU.minimax(!maximize, board, col, row, k, alpha, beta, ply+1, sliding);
          GU.setBoardVal(col, row, board, '');

          if(maximize && response[0] > value[0]) {
            alpha = response[0];
            bestMove = value = response;
          }
          if(!maximize && response[0] < value[0]) {
            beta = response[0];
            bestMove = value = response;
          }
          if(beta <= alpha) {
            break;
          }
        }
        return (ply==0 ? bestMove : value);
      }
    }
}).call(this);
