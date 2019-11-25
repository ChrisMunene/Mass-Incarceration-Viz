// (1) Load data asynchronously
queue()
    .defer(d3.json, "data/fipsToState.json")
    .defer(d3.json, "https://d3js.org/us-10m.v1.json")
    .defer(d3.csv, "data/World_Stats.csv")
    // .defer(d3.csv, "data/State_Data.csv")
    .defer(d3.csv, "data/2016StateData.csv")
    // .defer(d3.csv, "data/2015.csv")
    .await(createVis);

let cartogram = null;

function createVis(error, fipsToState, us, world_data, state_data2016) {
    _.each(world_data, country => {
        country['Prison Population Total'] = _.toNumber(country['Prison Population Total'].replace(/[\s,]/g, ''))
        country['Prison Population Rate'] = _.toNumber(country['Prison Population Rate'].replace(/[\s,]/g, ''))
    });
    _.each(state_data2016, state =>{
        state['Total']  = _.toNumber(state['Total'].replace(/[\s,]/g, ''))
        state['Rate Per 100000 Adult']  = _.toNumber(state['Rate Per 100000 Adult'].replace(/[\s,]/g, ''))
        state['Rate Per 100000 All Ages']  = _.toNumber(state['Rate Per 100000 All Ages'].replace(/[\s,]/g, ''))
    })

    cartogram = new Cartogram(['us-cartogram', 'world-circles'], {
        'world': world_data,
        'state': state_data2016,
        'us': us,
        'fipsToState': fipsToState
    })
    // let choropleth = new Choropleth("choropleth", {'us':us, 'prisonData':dataObj});
    // let cartogram = new Cartogram("cartogram", {'fipsToState': fipsToState, 'us': us, 'prisonData': dataObj});
    // d3.select("#cartogram-button").on("click", cartogram.simulate())
}

function nextPage() {
    cartogram.wrangleData()
}
