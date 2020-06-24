<template>
    <div id="app">
        <pivot-table
            :summary="summary"
            :rows="rows"
            :columns="columns"
            :values="values"
            :data="tableData"
            @on-change="handleChange"
            @on-dragend="handleDragEnd"
        ></pivot-table>
    </div>
</template>

<script>
import PivotTable from "./components/PivotTable";
import DEMODATA from "./components/PivotTable/mock/data";

const STATUS = {
    1: {
        rows: true,
        columns: false,
        values: false,
    },
    2: {
        rows: false,
        columns: true,
        values: false,
    },
    3: {
        rows: false,
        columns: false,
        values: true,
    },
    4: {
        rows: true,
        columns: true,
        values: false,
    },
    5: {
        rows: true,
        columns: false,
        values: true,
    },
    6: {
        rows: false,
        columns: true,
        values: true,
    },
    7: {
        rows: true,
        columns: true,
        values: true,
    },
};

const state = 7;

export default {
    name: "App",
    data: () => ({
        rows: STATUS[state].rows
            ? [
                  {
                      key: "date",
                      label: "日期",
                      //   values: ["2020-06-04", "2020-06-05"],
                  },
                  {
                      key: "time",
                      label: "时间",
                      //   values: ["01:00", "02:00"],
                  },
              ]
            : [],
        columns: STATUS[state].columns
            ? [
                  {
                      key: "media",
                      label: "Media",
                      //   values: ["媒体1", "媒体2"],
                  },
                  {
                      key: "account",
                      label: "Account",
                      //   values: ["账号1", "账号2"],
                  },
                  {
                      key: "proxy",
                      label: "Proxy",
                      //   values: ["代理1", "代理2"],
                  },
              ]
            : [],
        values: STATUS[state].values
            ? [
                  {
                      key: "click",
                      label: "Clicks",
                      handle(data) {
                          if (!data.length) return "";
                          let total = 0;
                          data.forEach((item) => {
                              total += item.click;
                          });
                          return total;
                      },
                  },
                  {
                      key: "download",
                      label: "Downloads",
                      handle(data) {
                          if (!data.length) return "";
                          let total = 0;
                          data.forEach((item) => {
                              total += item.download;
                          });
                          return total;
                      },
                  },
                  {
                      key: "abc",
                      label: "ABC",
                      handle(data) {
                          if (!data.length) return "";
                          let total = 0;
                          data.forEach((item) => {
                              total += item.download;
                          });
                          return total;
                      },
                  },
                  // {
                  //     key: "div",
                  //     label: "DIVs",
                  //     handle(data) {
                  //         if (!data.length) return "";
                  //         let total = 0;
                  //         data.forEach(item => {
                  //             total += item.download;
                  //         });
                  //         return total;
                  //     }
                  // }
              ]
            : [],
        summary: [
            {
                label: "求和",
                type: "column",
                handle(data) {
                    return data
                        .map((item) => {
                            const { click = 0, download = 0 } = item;
                            return +click + +download;
                        })
                        .reduce((prev, next) => prev + next);
                },
            },
            {
                label: "行求和",
                type: "row",
                handle(data) {
                    if (!data.length) return "";
                    return data
                        .filter((num) => num !== "")
                        .reduce((prev, curr) => prev + curr, 0);
                },
            },
            {
                label: "相除",
                type: "column",
                handle(data) {
                    let clicks = 0;
                    let downloads = 0;

                    data.forEach(({ click = 0, download = 0 }) => {
                        clicks += +click;
                        downloads += +download;
                    });

                    console.log(clicks, downloads);

                    const result = clicks / downloads;

                    return Number.isNaN(result)
                        ? ""
                        : (result * 100).toFixed(2) + "%";
                },
            },
        ],
        columnSummarys: [],
        tableData: DEMODATA,
    }),
    components: {
        PivotTable,
    },
    // mounted() {
    //     setTimeout(() => {
    //         this.columns = [];
    //     }, 1000);
    // },
    methods: {
        handleAllRowSummary(data) {
            const sum = data.reduce((prev, curr) => prev + curr);
            return parseFloat((sum / data.length).toFixed(2));
        },
        handleAllColumnSummary(data) {
            const { click, download } = data;
            return parseFloat((click / download).toFixed(2));
        },
        handleChange() {
            console.log("change");
        },
        handleDragEnd(data, allData) {
            console.log("drag end", data, allData);
        },
    },
};
</script>

<style lang="scss">
* {
    margin: 0;
    padding: 0;
}
</style>
