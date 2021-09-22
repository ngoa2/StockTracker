<script>
    export let stockName;
    export let tickerSymbol;
</script>

<div id="container">
    <div id="name">
        <p id="subtitle">{tickerSymbol}</p>
        <p id="title">{stockName}</p>
    </div>

    <div id="values">
        <p id="price">$145</p>
        <p id="percent-change">.022%</p>
        <p id="change">+32.49 Today</p>
    </div>
</div>

<style>
    @import url("https://fonts.googleapis.com/css2?family=Open+Sans:wght@300;400&display=swap");

    div#container {
        margin-bottom: 1rem;
    }
    p {
        font-family: "Open Sans", Roboto, Arial, sans-serif;
        letter-spacing: 0;
        margin: 10px;
    }
    p#title {
        font-size: 1.5rem;
        font-weight: 400;
    }
    p#subtitle {
        font-size: 0.9rem;
    }

    p#price {
        font-size: 2.25rem;
        font-weight: 400;
    }

    div#name {
        border-bottom: 1px solid #e8eaed;
    }

    div#values {
        display: flex;
        flex: 1;
        flex-direction: row;
        align-items: center;
    }

    p#percent-change {
        letter-spacing: 0.00625em;
        font-size: 1rem;
        font-weight: 500;
        line-height: 1.5rem;
        padding: 0 8px;
        border-radius: 8px;
        width: min-content;
        color: #137333;
        background: #e6f4ea;
    }

    p#change {
        color: #137333;
    }
</style>
