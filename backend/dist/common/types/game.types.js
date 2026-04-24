"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ClientEvent = exports.ServerEvent = exports.RoomStatus = exports.VALID_BID_VALUES = exports.BidType = exports.GamePhase = exports.Rank = exports.Suit = void 0;
var Suit;
(function (Suit) {
    Suit["Hearts"] = "hearts";
    Suit["Diamonds"] = "diamonds";
    Suit["Clubs"] = "clubs";
    Suit["Spades"] = "spades";
})(Suit || (exports.Suit = Suit = {}));
var Rank;
(function (Rank) {
    Rank["Seven"] = "7";
    Rank["Eight"] = "8";
    Rank["Nine"] = "9";
    Rank["Ten"] = "10";
    Rank["Jack"] = "J";
    Rank["Queen"] = "Q";
    Rank["King"] = "K";
    Rank["Ace"] = "A";
})(Rank || (exports.Rank = Rank = {}));
var GamePhase;
(function (GamePhase) {
    GamePhase["WaitingForPlayers"] = "waiting_for_players";
    GamePhase["Dealing"] = "dealing";
    GamePhase["Bidding"] = "bidding";
    GamePhase["Playing"] = "playing";
    GamePhase["TrickResolution"] = "trick_resolution";
    GamePhase["RoundScoring"] = "round_scoring";
    GamePhase["GameOver"] = "game_over";
})(GamePhase || (exports.GamePhase = GamePhase = {}));
var BidType;
(function (BidType) {
    BidType["Pass"] = "pass";
    BidType["Bid"] = "bid";
    BidType["Coinche"] = "coinche";
    BidType["Surcoinche"] = "surcoinche";
})(BidType || (exports.BidType = BidType = {}));
exports.VALID_BID_VALUES = [80, 90, 100, 110, 120, 130, 140, 150, 160, 250];
var RoomStatus;
(function (RoomStatus) {
    RoomStatus["Waiting"] = "waiting";
    RoomStatus["Full"] = "full";
    RoomStatus["Playing"] = "playing";
    RoomStatus["Finished"] = "finished";
})(RoomStatus || (exports.RoomStatus = RoomStatus = {}));
var ServerEvent;
(function (ServerEvent) {
    ServerEvent["RoomUpdate"] = "room:update";
    ServerEvent["GameStarted"] = "game:started";
    ServerEvent["CardsDealt"] = "game:cards_dealt";
    ServerEvent["BidMade"] = "game:bid_made";
    ServerEvent["ContractSet"] = "game:contract_set";
    ServerEvent["YourTurn"] = "game:your_turn";
    ServerEvent["CardPlayed"] = "game:card_played";
    ServerEvent["TrickWon"] = "game:trick_won";
    ServerEvent["RoundComplete"] = "game:round_complete";
    ServerEvent["GameOver"] = "game:game_over";
    ServerEvent["PlayerReconnected"] = "player:reconnected";
    ServerEvent["PlayerDisconnected"] = "player:disconnected";
    ServerEvent["ChatMessage"] = "chat:message";
    ServerEvent["Error"] = "error";
})(ServerEvent || (exports.ServerEvent = ServerEvent = {}));
var ClientEvent;
(function (ClientEvent) {
    ClientEvent["JoinRoom"] = "room:join";
    ClientEvent["LeaveRoom"] = "room:leave";
    ClientEvent["Ready"] = "room:ready";
    ClientEvent["PlaceBid"] = "game:bid";
    ClientEvent["PlayCard"] = "game:play_card";
    ClientEvent["SendChat"] = "chat:send";
})(ClientEvent || (exports.ClientEvent = ClientEvent = {}));
//# sourceMappingURL=game.types.js.map