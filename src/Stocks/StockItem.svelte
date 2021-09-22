<script>
    import { createEventDispatcher } from "svelte";
    import Button from "../Components/Button.svelte";
    const dispatch = createEventDispatcher();

    export let stockName;
    export let tickerSymbol;
    export let price;
    export let dp;
    export let change;
</script>

<div id="container">
    <div id="name">
        <div>
            <p id="subtitle">{tickerSymbol}</p>
            <p id="title">{stockName}</p>
        </div>

        <div>
            <Button
                caption="Update"
                mode="update"
                on:click={() => {
                    dispatch("delete", stockName);
                }}
            />
            <Button
                caption="Delete"
                mode="delete"
                on:click={() => {
                    dispatch("delete", stockName);
                }}
            />
        </div>
    </div>

    <div id="values">
        <p id="price">${price}</p>

        {#if dp < 0}
            <p class="percent-change negative-percent">{dp}%</p>
        {:else}
            <p class="percent-change positive-percent">{dp}%</p>
        {/if}

        {#if change < 0}
            <p class="change negative-change">{change}</p>
        {:else}
            <p class="change positive-change">+{change}</p>
        {/if}
    </div>
</div>

<style>
    @import url("https://fonts.googleapis.com/css2?family=Open+Sans:wght@300;400&display=swap");

    div#container {
        margin-bottom: 1rem;
        border: 1px solid lightgray;
        padding: 5px;
        border-radius: 15px;
        width: 40rem;
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
        flex-direction: row;
        display: flex;
        justify-content: space-between;
    }

    div#values {
        display: flex;
        flex: 1;
        flex-direction: row;
        align-items: center;
    }

    p.percent-change {
        letter-spacing: 0.00625em;
        font-size: 1rem;
        font-weight: 500;
        line-height: 1.5rem;
        padding: 0 8px;
        border-radius: 8px;
        width: min-content;
        background: #e6f4ea;
    }
    p.negative-percent {
        background: #fce8e6;
    }

    p.postive-percent {
        background: #e6f4ea;
    }
    p.negative-change {
        color: #a50e0e;
    }
    p.positive-change {
        color: #137333;
    }
</style>
