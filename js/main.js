// (1) Load data asynchronously
queue()
    .defer(d3.json, "data/fipsToState.json")
    .defer(d3.json, "https://d3js.org/us-10m.v1.json")
    .defer(d3.json, "https://d3js.org/world-110m.v1.json")
    .defer(d3.json, "data/bardata.json")
    .defer(d3.json, "data/choro.json")
    .defer(d3.json, "data/fipsToState.json")
    .defer(d3.json, "data/fipsToStateName.json")
    .defer(d3.csv, "data/World_Stats.csv")
    // .defer(d3.csv, "data/State_Data.csv")
    .defer(d3.csv, "data/2016StateData.csv")
    .defer(d3.csv, "data/prison_suspension.csv")
    .defer(d3.csv, "data/incarceration_trends.csv")
    .defer(d3.tsv, "https://cdn.rawgit.com/mbostock/4090846/raw/d534aba169207548a8a3d670c9c2cc719ff05c47/world-country-names.tsv")
    .defer(d3.csv, "data/2015.csv")
    .await(createVis);
let cartogram = null;
let barchart = null;
let choropleth = null;

function createVis(
    error,
    fipsToState,
    us,
    world,
    bardata,
    choro,
    fipstostate,
    fipsToStateName,
    world_data,
    state_data2016,
    schoolData,
    trendsData,
    countryNames,
    prisonData
) {
    _.each(world_data, country => {
        country["Prison Population Total"] = _.toNumber(
            country["Prison Population Total"].replace(/[\s,]/g, "")
        );
        country["Prison Population Rate"] = _.toNumber(
            country["Prison Population Rate"].replace(/[\s,]/g, "")
        );
    });
    _.each(state_data2016, state => {
        state["Total"] = _.toNumber(state["Total"].replace(/[\s,]/g, ""));
        state["Rate Per 100000 Adult"] = _.toNumber(
            state["Rate Per 100000 Adult"].replace(/[\s,]/g, "")
        );
        state["Rate Per 100000 All Ages"] = _.toNumber(
            state["Rate Per 100000 All Ages"].replace(/[\s,]/g, "")
        );
    });

    cartogram = new Cartogram(["us-cartogram", "world-circles"], {
        worldData: world_data,
        state: state_data2016,
        us: us,
        world: world,
        fipsToState: fipsToStateName,
        countryNames: countryNames
    });

    var ch_bar_eventHandler = {};

    choropleth = new Choropleth("choro-vis", {'us': us, 'fips': fipsToState, 'choroData': choro}, ch_bar_eventHandler);
    barchart = new BarVis("bar-vis", bardata, ch_bar_eventHandler);

    $(ch_bar_eventHandler).bind("selectionChanged", function (event, race, selected, clicked) {
        choropleth.onSelectionChange(race, selected, clicked);
    });

    scatterplot = new Scatterplot("scatterplot", schoolData);
    // 1. Create event handler
    var matrices = new Map();
    matrices.set(0, {
        handler: {},
        tag: `selectionChanged${0}`,
        size: 10,
        svg: {},
        parent: "dot-matrix"
    });

    matrices.set(1, {
        handler: {},
        tag: `selectionChanged${1}`,
        size: 10,
        svg: {},
        parent: "dot-matrix-race"
    });

    matrices.set(2, {
        handler: {},
        tag: `selectionChanged${2}`,
        size: 10,
        svg: {},
        parent: "dot-matrix-school"
    });

    matrices.forEach((matrix, index) => {
        const {handler, tag, size, parent} = matrix;
        matrix.svg = new Matrix(parent, trendsData, size, handler, tag, index);
        $(handler).bind(tag, function (event, value) {
            matrix.svg.setSelectedRange(value);
        });
    });

}

function nextPage() {
    cartogram.wrangleData();
}

function updateBar() {
    barchart.dropdownChanged();

}

function sortButtonBar() {
    barchart.sortButton();
}

$(".fp-controlArrow").click(() => {
    console.log(window.location.hash.split("/"));
});

function numberWithCommas(x) {
    let string = _.toString(x)
    return _.replace(string, /\B(?=(\d{3})+(?!\d))/g, ",");
}
