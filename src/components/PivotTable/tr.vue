<template>
    <template v-if="isMultiTr">
        <tr v-for="(item, index) in data" :key="index">
            <slot></slot>
        </tr>
        <template
    </template>
    <template v-else>
        <tr v-for="(item, index) in data" :key="index">
            <slot></slot>
        </tr>
    </template>

    <template>
        <table>
            <template v-for="tr in tableData">
                <!-- multi row -->
                <template v-if="Array.isArray(tr[0])">
                    <tr v-for="(_tr, _trIndex) in tr" :key="_trIndex">
                        <template v-for="(td, tdIndex) in _tr">
                            <template v-if="Array.isArray(td)">
                                <td
                                    v-for="(_td, _tdIndex) in td.slice(1)"
                                    :key="tdIndex + _tdIndex + ''"
                                    :rowspan="_td.rowspan"
                                    :colspan="_td.colspan"
                                >
                                    <div
                                        :class="{
                                            summary: _td.isSummary,
                                            dragged: _td.dragged,
                                        }"
                                    >
                                        {{ _td.value }}
                                    </div>
                                </td>
                            </template>
                            <td
                                v-else
                                :key="tdIndex"
                                :rowspan="td.rowspan"
                                :colspan="td.colspan"
                            >
                                <div
                                    :class="{
                                        summary: td.isSummary,
                                        dragged: td.dragged,
                                    }"
                                >
                                    {{ td.value }}
                                </div>
                            </td>
                        </template>
                    </tr>
                </template>
                <tr v-else>
                    <template v-for="(td, tdIndex) in tr">
                        <template v-if="Array.isArray(td)">
                            <td
                                v-for="(_td, _tdIndex) in td.slice(1)"
                                :key="tdIndex + _tdIndex + ''"
                                :rowspan="_td.rowspan"
                                :colspan="_td.colspan"
                            >
                                <div
                                    :class="{
                                        summary: _td.isSummary,
                                        dragged: _td.dragged,
                                    }"
                                >
                                    {{ _td.value }}
                                </div>
                            </td>
                        </template>
                        <td
                            v-else
                            :key="tdIndex"
                            :rowspan="td.rowspan"
                            :colspan="td.colspan"
                        >
                            <div
                                :class="{
                                    summary: td.isSummary,
                                    dragged: td.dragged,
                                }"
                            >
                                {{ td.value }}
                            </div>
                        </td>
                    </template>
                </tr>
            </template>
        </table>
    </template>
</template>

<script>
export default {
    name: "Tr",
    props: {
        data: {
            type: Array,
            default: () => [],
        },
    },
    computed: {
        isMultiTr() {
            return Array.isArray(this.data[0]);
        },
        rowCount() {
            return this.isMultiTr ? this.data.length : 1
        },
    },
    methods: {
        getColCount()
    }
};
</script>
