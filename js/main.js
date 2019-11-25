// (1) Load data asynchronously
queue()
  // .defer(d3.json, "https://d3js.org/us-10m.v1.json")
  .defer(d3.json, "https://d3js.org/us-10m.v1.json")
  .defer(d3.csv, "data/incarceration_trends.csv")
  .await(createVis);

function createVis(error, us, data) {
  // 1. Create event handler
  var eventHandler = {};
  let dataObj = _.keyBy(data, "yfips");
  // let choropleth = new Choropleth("choropleth", {'us':us, 'prisonData':dataObj});
  let cartogram = new Cartogram("choropleth", { us: us, prisonData: dataObj });

  let matrixViz1 = new Matrix("dot-matrix", data, 18, eventHandler);
  let matrixViz2 = new Matrix("dot-matrix-2", data, 18, eventHandler);

  $(eventHandler).bind("selectionChanged", function(event, value) {
    matrixViz2.setSelectedRange(value);
    fullpage_api.moveTo("slide3", 1);
  });
}
