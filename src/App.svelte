<script>
	import StockList from "./Stocks/StockList.svelte";
	import stocks from "./Stocks/stock-store";
	import Header from "./Components/Header.svelte";
	import StockDetails from "./Stocks/StockDetails.svelte";

	let apiKey = "c556jkqad3iak9epgvr0";
	let apiToken = "&token=" + apiKey;

	let finnHubURL = "https://finnhub.io/api/v1/";
	let searchInput = "";

	function getStock() {
		let stockToAdd = {};

		fetch(finnHubURL + "search?q=" + searchInput + apiToken)
			.then((res) => {
				return res.json();
			})
			.then((data) => {
				let firstResult = data.result[0];
				let name = firstResult.description;
				let symbol = firstResult.symbol;

				stockToAdd.stockName = name;
				stockToAdd.tickerSymbol = symbol;

				return fetch(finnHubURL + "/quote?symbol=" + symbol + apiToken);
			})
			.then((res) => {
				return res.json();
			})
			.then((data) => {
				stockToAdd.price = data.c;
				stockToAdd.dp = data.dp;
				stockToAdd.change = data.d;

				stocks.addStock(stockToAdd);
			})
			.catch((err) => {
				console.log(err);
			});
	}

	function updateStock(event) {
		let tickerSymbol = event.detail;
		let stockData = {};
		fetch(finnHubURL + "/quote?symbol=" + tickerSymbol + apiToken)
			.then((res) => {
				return res.json();
			})
			.then((data) => {
				stockData.price = data.c;
				stockData.dp = data.dp;
				stockData.change = data.d;
				console.log(stockData);
				stocks.updateStock(stockData, tickerSymbol);
			})
			.catch((err) => {
				console.log(err);
			});
	}

	function delStock(event) {
		stocks.deleteStock(event.detail);
	}

	let candleData = "empty";

	function getDetails() {
		let symbol = "AAPL";
		fetch(
			finnHubURL +
				"/stock/candle?symbol=" +
				symbol +
				"&resolution=30&from=1631781202&to=1632299602" +
				apiToken
		)
			.then((res) => {
				return res.json();
			})
			.then((data) => {
				candleData = data;
				console.log(candleData);
			})

			.catch((err) => {
				console.log(err);
			});
	}

	// https://finnhub.io/api/v1/webhook/
</script>

<main>
	<Header caption="Stock Tracker" />
	<h2>Instructions:</h2>
	<p>
		Search for a stock by using the searchbar below, and hit submit to get
		an up to date quote on it.
	</p>

	<input type="text" placeholder="Search" bind:value={searchInput} />
	<button on:click={getStock}>Submit</button>

	<div>
		<section>
			<StockList
				stocks={$stocks}
				on:delete={delStock}
				on:update={updateStock}
			/>
		</section>
	</div>
</main>

<style>
	main {
		margin: 5rem;
	}

	div {
		flex-direction: row;
		flex: 1;
		display: flex;
	}

	section {
		margin-right: 5rem;
	}
</style>
