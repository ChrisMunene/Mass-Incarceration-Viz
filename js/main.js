// (1) Load data asynchronously
queue()
// .defer(d3.json, "https://d3js.org/us-10m.v1.json")
    .defer(d3.json, "https://d3js.org/us-10m.v1.json")
    .defer(d3.csv, "data/incarceration_trends.csv")
    .defer(d3.csv, "data/VeraPlusSchoolsCounty.csv")
    .await(createVis);


function createVis(error, us, data) {
    let dataObj = _.keyBy(data, 'yfips');
    // let choropleth = new Choropleth("choropleth", {'us':us, 'prisonData':dataObj});
    let cartogram = new Cartogram("choropleth", {'us': us, 'prisonData': dataObj});
    let scatterplot = new Scatterplot("scatterplot", {'us': us, 'prisonData': dataObj});

}
