


// (1) Load data asynchronously
queue()
	.defer(d3.json,"data/perDayData.json")
	.defer(d3.json,"data/myWorldFields.json")
	.await(createVis);


function createVis(error, perDayData, metaData){
	

}
