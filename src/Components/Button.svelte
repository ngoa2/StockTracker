<script>
    export let caption;
    export let mode;
</script>

<button class={mode} on:click>{caption}</button>

<style>
    button {
        background-color: transparent;
        border: none;
    }

    button.delete {
        color: #de5246;
    }

    button.update {
        color: #4c8bf5;
    }
</style>
