import json
import mimetypes
import time
import uuid
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import parse_qs, urlparse


HOST = "0.0.0.0"
PORT = 8000
UI_DIR = Path(__file__).resolve().parent / "ui"

VALID_USERS = {
    "qa_user": "qa_pass",
    "performance_user": "secret123",
    "trader_user": "trade123",
}

MARKET_STATE = {
    "status": "OPEN",
}

MARKET_TICKERS = [
    {"symbol": "BBCA", "lastPrice": 9825, "changePct": 1.24, "volume": 125_000_000},
    {"symbol": "BBRI", "lastPrice": 4710, "changePct": -0.42, "volume": 210_000_000},
    {"symbol": "TLKM", "lastPrice": 3250, "changePct": 0.58, "volume": 145_000_000},
    {"symbol": "ASII", "lastPrice": 5125, "changePct": 1.12, "volume": 88_000_000},
    {"symbol": "GOTO", "lastPrice": 76, "changePct": 2.70, "volume": 1_250_000_000},
]

ORDER_BOOK = {
    "BBCA": {
        "bids": [{"price": 9820, "lot": 1200}, {"price": 9815, "lot": 1450}],
        "asks": [{"price": 9830, "lot": 1100}, {"price": 9835, "lot": 980}],
    },
    "BBRI": {
        "bids": [{"price": 4705, "lot": 1800}, {"price": 4700, "lot": 2100}],
        "asks": [{"price": 4715, "lot": 1600}, {"price": 4720, "lot": 1950}],
    },
    "TLKM": {
        "bids": [{"price": 3245, "lot": 900}, {"price": 3240, "lot": 1050}],
        "asks": [{"price": 3255, "lot": 890}, {"price": 3260, "lot": 920}],
    },
    "ASII": {
        "bids": [{"price": 5120, "lot": 650}, {"price": 5115, "lot": 700}],
        "asks": [{"price": 5130, "lot": 720}, {"price": 5135, "lot": 680}],
    },
    "GOTO": {
        "bids": [{"price": 75, "lot": 10000}, {"price": 74, "lot": 13000}],
        "asks": [{"price": 76, "lot": 9800}, {"price": 77, "lot": 10400}],
    },
}

USER_PORTFOLIOS = {
    "qa_user": {
        "buyingPower": 150_000_000,
        "positions": [
            {"symbol": "BBCA", "quantity": 300, "avgPrice": 9550},
            {"symbol": "TLKM", "quantity": 500, "avgPrice": 3180},
        ],
    },
    "performance_user": {
        "buyingPower": 450_000_000,
        "positions": [
            {"symbol": "BBRI", "quantity": 800, "avgPrice": 4600},
            {"symbol": "ASII", "quantity": 250, "avgPrice": 5000},
        ],
    },
    "trader_user": {
        "buyingPower": 900_000_000,
        "positions": [
            {"symbol": "BBCA", "quantity": 1200, "avgPrice": 9400},
            {"symbol": "GOTO", "quantity": 12000, "avgPrice": 72},
        ],
    },
}

DEFAULT_WATCHLIST = ["BBCA", "BBRI", "TLKM", "ASII", "GOTO"]
SESSIONS = {}
SESSION_STATE = {}


def json_response(handler, status, payload):
    body = json.dumps(payload).encode("utf-8")
    handler.send_response(status)
    handler.send_header("Content-Type", "application/json")
    handler.send_header("Content-Length", str(len(body)))
    handler.end_headers()
    handler.wfile.write(body)


def find_ticker(symbol):
    return next((item for item in MARKET_TICKERS if item["symbol"] == symbol), None)


class LabHandler(BaseHTTPRequestHandler):
    server_version = "qa-lab-trading-app/2.0"

    def log_message(self, format, *args):
        return

    def _read_json(self):
        content_length = int(self.headers.get("Content-Length", "0"))
        if content_length == 0:
            return {}
        raw_body = self.rfile.read(content_length)
        return json.loads(raw_body.decode("utf-8"))

    def _serve_file(self, file_path):
        if not file_path.exists() or not file_path.is_file():
            return json_response(self, 404, {"message": "Not found"})

        body = file_path.read_bytes()
        content_type, _ = mimetypes.guess_type(file_path.name)
        self.send_response(200)
        self.send_header("Content-Type", content_type or "application/octet-stream")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)
        return None

    def _get_token(self):
        auth_header = self.headers.get("Authorization", "")
        if not auth_header.startswith("Bearer "):
            return None
        return auth_header.split(" ", 1)[1]

    def _get_session(self):
        token = self._get_token()
        if not token:
            return None, None, None
        username = SESSIONS.get(token)
        state = SESSION_STATE.get(token)
        return token, username, state

    def do_GET(self):
        parsed = urlparse(self.path)
        path = parsed.path
        query = parse_qs(parsed.query)

        if path == "/":
            return self._serve_file(UI_DIR / "index.html")

        if path.startswith("/ui/"):
            relative_path = path.removeprefix("/ui/")
            return self._serve_file(UI_DIR / relative_path)

        if path == "/health":
            return json_response(
                self,
                200,
                {
                    "status": "ok",
                    "service": "qa-lab-trading-app",
                    "timestamp": int(time.time()),
                    "marketStatus": MARKET_STATE["status"],
                },
            )

        if path == "/api/market/tickers":
            return json_response(
                self,
                200,
                {
                    "tickers": MARKET_TICKERS,
                    "count": len(MARKET_TICKERS),
                    "marketStatus": MARKET_STATE["status"],
                },
            )

        if path == "/api/market/depth":
            symbol = query.get("symbol", ["BBCA"])[0]
            depth = ORDER_BOOK.get(symbol)
            if not depth:
                return json_response(self, 404, {"message": "Symbol not found"})
            return json_response(
                self,
                200,
                {"symbol": symbol, "depth": depth, "serverTime": int(time.time())},
            )

        token, username, state = self._get_session()

        if path == "/api/watchlist":
            if not username:
                return json_response(self, 401, {"message": "Unauthorized"})
            symbols = state["watchlist"]
            tickers = [item for item in MARKET_TICKERS if item["symbol"] in symbols]
            return json_response(self, 200, {"username": username, "symbols": symbols, "tickers": tickers})

        if path == "/api/portfolio":
            if not username:
                return json_response(self, 401, {"message": "Unauthorized"})
            base = USER_PORTFOLIOS[username]
            return json_response(
                self,
                200,
                {
                    "username": username,
                    "buyingPower": base["buyingPower"],
                    "positions": base["positions"],
                    "openOrders": len(state["orders"]),
                    "updatedAt": int(time.time()),
                },
            )

        if path == "/api/orders":
            if not username:
                return json_response(self, 401, {"message": "Unauthorized"})
            return json_response(self, 200, {"username": username, "orders": state["orders"]})

        if path.startswith("/api/orders/"):
            if not username:
                return json_response(self, 401, {"message": "Unauthorized"})

            order_id = path.rsplit("/", 1)[-1]
            order = next((item for item in state["orders"] if item["orderId"] == order_id), None)
            if not order:
                return json_response(self, 404, {"message": "Order not found"})
            return json_response(self, 200, order)

        if path == "/api/products":
            return json_response(
                self,
                200,
                {"products": [{"id": item["symbol"], "name": item["symbol"]} for item in MARKET_TICKERS]},
            )

        return json_response(self, 404, {"message": "Not found"})

    def do_POST(self):
        parsed = urlparse(self.path)
        path = parsed.path

        if path == "/api/login":
            payload = self._read_json()
            username = payload.get("username")
            password = payload.get("password")

            if VALID_USERS.get(username) != password:
                return json_response(self, 401, {"message": "Invalid credentials"})

            token = str(uuid.uuid4())
            SESSIONS[token] = username
            SESSION_STATE[token] = {
                "watchlist": list(DEFAULT_WATCHLIST),
                "orders": [],
            }

            return json_response(
                self,
                200,
                {
                    "token": token,
                    "user": {"username": username, "role": "retail-trader"},
                },
            )

        token, username, state = self._get_session()
        if not username:
            return json_response(self, 401, {"message": "Unauthorized"})

        if path == "/api/orders":
            payload = self._read_json()
            symbol = payload.get("symbol")
            side = payload.get("side", "BUY")
            quantity = int(payload.get("quantity", 1))
            order_type = payload.get("type", "MARKET")
            client_order_id = payload.get("clientOrderId")

            ticker = find_ticker(symbol)
            if not ticker:
                return json_response(self, 404, {"message": "Symbol not found"})

            if side not in {"BUY", "SELL"}:
                return json_response(self, 400, {"message": "Invalid side"})

            if order_type not in {"MARKET", "LIMIT"}:
                return json_response(self, 400, {"message": "Invalid order type"})

            if quantity <= 0:
                return json_response(self, 400, {"message": "Quantity must be positive"})

            if MARKET_STATE["status"] != "OPEN":
                return json_response(self, 503, {"message": "Market is closed"})

            if client_order_id and any(
                item.get("clientOrderId") == client_order_id for item in state["orders"]
            ):
                return json_response(self, 409, {"message": "Duplicate client order id"})

            if side == "BUY":
                buying_power = USER_PORTFOLIOS[username]["buyingPower"]
                estimated_cost = ticker["lastPrice"] * quantity
                if estimated_cost > buying_power:
                    return json_response(self, 422, {"message": "Insufficient buying power"})

            order_id = f"TRX-{uuid.uuid4().hex[:10].upper()}"
            order = {
                "orderId": order_id,
                "username": username,
                "symbol": symbol,
                "side": side,
                "quantity": quantity,
                "type": order_type,
                "clientOrderId": client_order_id,
                "status": "FILLED",
                "filledPrice": ticker["lastPrice"],
                "createdAt": int(time.time()),
            }
            state["orders"].append(order)
            return json_response(self, 201, order)

        if path == "/api/cart":
            payload = self._read_json()
            symbol = payload.get("productId")
            quantity = int(payload.get("quantity", 1))
            ticker = find_ticker(symbol)
            if not ticker:
                return json_response(self, 404, {"message": "Product not found"})
            order = {
                "orderId": f"ORD-{uuid.uuid4().hex[:10].upper()}",
                "username": username,
                "symbol": symbol,
                "quantity": quantity,
                "filledPrice": ticker["lastPrice"],
                "status": "QUEUED",
            }
            state["orders"].append(order)
            return json_response(self, 200, {"message": "Queued", "itemCount": len(state["orders"]), "items": state["orders"]})

        if path == "/api/checkout":
            queued = next((item for item in state["orders"] if item["status"] == "QUEUED"), None)
            if not queued:
                return json_response(self, 400, {"message": "Cart is empty"})
            queued["status"] = "FILLED"
            queued["createdAt"] = int(time.time())
            return json_response(self, 201, queued)

        if path == "/api/admin/market-state":
            payload = self._read_json()
            status = payload.get("status")
            if status not in {"OPEN", "HALTED", "CLOSED"}:
                return json_response(self, 400, {"message": "Invalid market status"})
            MARKET_STATE["status"] = status
            return json_response(self, 200, {"marketStatus": MARKET_STATE["status"]})

        return json_response(self, 404, {"message": "Not found"})


if __name__ == "__main__":
    server = ThreadingHTTPServer((HOST, PORT), LabHandler)
    print(f"QA Lab trading app listening on http://{HOST}:{PORT}", flush=True)
    server.serve_forever()
