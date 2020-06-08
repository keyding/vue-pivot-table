<template>
    <td v-for="(item, index) in data" :key="index">
        <slot></slot>
    </td>
</template>

<script>
export default {
    name: "Td",
    props: {
        data: {
            type: Array,
            default: () => [],
        },
    },
};
</script>
