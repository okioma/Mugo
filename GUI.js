/*
Global Variables
*/
var aoi,
    areaOfInterest,
    Fimageyr1,Fimageyr2,Fimageyr3,
    geometry,
    thresh,
    yr1,yr2,yr3

/*
Visualization parameters
*/

var VEG = {"opacity":1,"palette":["2ddc0d"],"min":0,"max":1}
var MG = {"opacity":1, "palette":["ffffff", "085a16"], "min":0, "max":2}
var LG = {"opacity":1, "palette":["ff7c0b", "ffffff"], "min":-2, "max":0}
var visNDVI = {min: -1, max: 1, palette: ['blue', 'white', 'green']};
var FLG = {"opacity":1, "palette":[ "ffffff", "ff7c0b"], "min":0, "max":2}

/*
Create the panel
*/

// Generate main panel and add it to the map.
var panel = ui.Panel({style: {width:'45.333%'}});
ui.root.insert(0,panel);

// Define title and description.
var intro = ui.Label('Delta Watch: An Example GEE GUI ',
  {fontWeight: 'bold', fontSize: '24px', margin: '10px 5px'}
);
var subtitle = ui.Label('Use 30 m Landsat 5,7,8 imagery to'+
  ' visualize changes in delta vegetation patterns over time.'+
  ' Select from multiple area of interest and type of visualization; single year binary '+
  ' or change over time.', {});

// Add title and description to the panel  
panel.add(intro).add(subtitle);
/*
Define study areas.
*/
// Generate polygons for each study region.
var colo = ee.Geometry.Polygon([[-115.29,32.20], [-114.89,31.17],
   [-114.40,31.64], [-115.14,32.19], [-115.29,32.20]]),
    nile = ee.Geometry.Polygon([[28.76,31.49],[30.69,29.91],
      [31.52, 29.96],[32.89,31.43],[31.00,31.76],[28.76,31.49]]),
    bets = ee.Geometry.Polygon([[46.19,-15.66],[46.25,-16.04],
      [46.51,-16.15],[46.70,-16.06],[46.19,-15.66]])

// Define labels for each study region.
var COLO = 'Colorado River Delta',
    NILE = 'Nile River Delta',
    BETS = 'Betsiboka River Delta'

/*
Select Area of INTEREST
*/

// Define the select button for the AOI
var selectAoi = ui.Select({
  items:[COLO,NILE,BETS],
  placeholder:'Select area of interest',
  });

// Add a label.
var selectSIAOI = ui.Label({value:'Select area of interest',
style: {fontSize: '18px', fontWeight: 'bold'}});

// Add the select AOI panel to the map panel.
panel.add(selectSIAOI)
    .add(selectAoi);

//Function to create a binary NDVI map for a user selected year and AOI.
function NDVIBIN (){
    applyFilter();
    var Nimage = Fimageyr1.expression(
    "NDVI >= thresh1", {
      'NDVI': Fimageyr1.select('NDVI').clip(geometry),
      'thresh1' : NDVIslider.getValue()}); //Slider bar input

      var NDVIMimage = Nimage.updateMask(Nimage.gt(0)); //Mask 0 values
      Map.centerObject(geometry); //Center on AOI
      Map.addLayer(NDVIMimage, VEG, 'NDVI Landsat Binary Map(' + yr1+ ')');
}

// Container function to create Image for mapping.
function applyFilter(){
/*
Defining the area of interested
*/

function setAreaOfInterest(){
  aoi = selectAoi.getValue();
  if (aoi == COLO){
      areaOfInterest = colo;
  }//sets the area to nile river delta
  else if(aoi == NILE){
      areaOfInterest = nile;
  }//sets the area of interest to
  else if (aoi == BETS){
      areaOfInterest = bets;
  }
}

setAreaOfInterest();

geometry = areaOfInterest

/*
Defining years for image selection
*/
    yr1 = selectYr1.getValue(); //Input for Landsat Binary Map
    yr2 = selectYr2.getValue(); //Input for Landsat Change Map Start Year
    yr3 = selectYr3.getValue(); //Input for Landsat Change Map End Year

/*
Creating image dictionaries.
*/

var constructLSDict = function(geometry)
  /*
  This function takes in a geometry feature from the GUI and uses it to
  generate a dictionary of median reduce images for the specified date
  range
  inputs
  geometry = defined by the GUI
  Features to change
  y_list = set based on sensor type
  imagecollection = unique id for collection type
  filterDate = cat() this is used to refine the month and day of start and end time
  With adaptation this should be flexible across sensors and times
  */
  {
  var startMonth = "-04-05"
  var endMonth = "-09-30"
  // Construct a dictionary for landsat 8 imagery.
  var y_list = ee.List.sequence(2013, 2018)
  var ystr_list = y_list.map(function(y){return ee.Number(y).format('%1d')})
  var ls8 = y_list.map(function(y){return ee.ImageCollection('LANDSAT/LC08/C01/T1_SR')
                                          .filterDate(ee.String(ee.Number(y).format('%1d')).cat(startMonth),
                                                      ee.String(ee.Number(y).format('%1d')).cat(endMonth))
                                          .filterBounds(geometry)
                                          .filterMetadata('CLOUD_COVER', 'less_than', 30)
                                          .median()})
  var ls8_dict = ee.Dictionary.fromLists(ystr_list, ls8);

  // Construct a dictionary for LS7 imagery
  var y_list7 = ee.List.sequence(2012, 2012)
  var ystr_list7 = y_list7.map(function(y){return ee.Number(y).format('%1d')})
  var ls7 = y_list7.map(function(y){return ee.ImageCollection('LANDSAT/LE07/C01/T1_SR')
                                          .filterDate(ee.String(ee.Number(y).format('%1d')).cat(startMonth),
                                                      ee.String(ee.Number(y).format('%1d')).cat(endMonth))
                                          .filterBounds(geometry)
                                          .filterMetadata('CLOUD_COVER', 'less_than', 30)
                                          .median()})
  var ls7_dict = ee.Dictionary.fromLists(ystr_list7, ls7);

  // Combine the LS8 and LS7 dictionaries.
  var ls8_ls7_dict = ls8_dict.combine(ls7_dict)

  // Construct a dictionary for Landsat 5.
  var y_list5 = ee.List.sequence(1984,2011)
  var ystr_list5 = y_list5.map(function(y){return ee.Number(y).format('%1d')})
  var ls5 = y_list5.map(function(y){return ee.ImageCollection('LANDSAT/LT05/C01/T1_SR')
                                          .filterDate(ee.String(ee.Number(y).format('%1d')).cat(startMonth),
                                                      ee.String(ee.Number(y).format('%1d')).cat(endMonth))
                                          .filterBounds(geometry)
                                          .filterMetadata('CLOUD_COVER', 'less_than', 30)
                                          .median()})
  var ls5_dict = ee.Dictionary.fromLists(ystr_list5, ls5);
  // Combine the LS5 with the LS8/7 dictionary
  var LS_Dict = ls8_ls7_dict.combine(ls5_dict)

  return(LS_Dict)
}

/*
Generating indices
*/
// A function to compute NDVI for Landsat 5 and 7.
var NDVI57 = function(image) {
  return image.normalizedDifference(["B4","B3"]).rename("NDVI");
};

// A function to compute NDVI for Landsat 8.
var NDVI8 = function(image) {
  return image.normalizedDifference(["B5","B4"]).rename("NDVI");
};


/*
Selecting bands based on years
*/

var selectYearAddBands = function(dictionary, year, geometry)
{
    if (year >= 2012) {
      var imageYear = ee.Image(dictionary.get(year)).clip(geometry)
      var outImage = imageYear.addBands(NDVI8(imageYear))
    } else if (year == 2011) {
      var imageYear = ee.Image(dictionary.get(year)).clip(geometry)
      var outImage = imageYear.addBands(NDVI57(imageYear))
    } else {
      var imageYear = ee.Image(dictionary.get(year)).clip(geometry)
      var outImage = imageYear.addBands(NDVI57(imageYear))
    }
  return (outImage)
};


// Make LS Dictionary and Select years of interest.
var dict_ls = constructLSDict(geometry);
  Fimageyr1 = selectYearAddBands(dict_ls, yr1, geometry); //LS BINARY
  Fimageyr2 = selectYearAddBands(dict_ls, yr2, geometry); //LS Change Start Year
  Fimageyr3 = selectYearAddBands(dict_ls, yr3, geometry); //LS Change End Year

}


/*
Defining time frame for Binary MAP
*/

var durpanel = ui.Label({
  value:'Select Year for Landsat 30m Binary Map',
  style:{fontSize: '18px', fontWeight: 'bold'}});

var selectYr1 = ui.Textbox({placeholder: 'Year',  value: '2018',
  style: {width: '100px'}});

var datasetRange_label = ui.Label('Choose year from 1984 - 2018      ',
  {margin: '0 0 0 10px',fontSize: '12px',color: 'gray'});

panel.add(durpanel)
  .add(datasetRange_label)
  .add(selectYr1);

// Add a slider bar widget
var NDVIslider = ui.Slider();
// Set a default value.
NDVIslider.setValue(0.17);  
NDVIslider.onChange(function(value) {
  Map.layers().get(0);
});
// Create a button that will run the function that creates the NDVI binary object
var NDVIBINMAP = ui.Button({label:'Landsat NDVI Map' , onClick:NDVIBIN});
// Add slider and Button to the map.
panel.add(NDVIslider)
  .add(NDVIBINMAP)

/*
Change maps
*/

// Generate a change map based on a user defined STARTYEAR, ENDYEAR, AND AOI.   
function GREENER() {
    applyFilter();
    var date1 = Fimageyr2.select('NDVI'); //Select NDVI Values for Start Year
    var date2 = Fimageyr3.select('NDVI'); //Select NDVI values for End Year
    var diff = date2.subtract(date1); //Subtract rasters to get maginitude of change
    var trend = date2.gt(date1); //Creates a binary where pixels that have a greater NDVI in year two are assigned a value of 1
    var final = trend.multiply(diff).clip(geometry); //Shows magnitude for greening trend

    Map.centerObject(geometry); // Center on AOI
    Map.addLayer(final, MG, 'Areas that have become more green(' + yr2 + ')-(' + yr3 + ')');
    Map.addLayer(date1, visNDVI, 'NDVI (' + yr2 + ')', false); //Creates a layer with the index in the Start Year.
    Map.addLayer(date2, visNDVI, 'NDVI(' + yr3 + ')', false); //Creates a layer with the index in the End Year.
  }
// Same process for areas that decrease in greenness
function LESSGREEN() {
      applyFilter();
    var date1 = Fimageyr2.select('NDVI'); //Select NDVI Values for Start Year
    var date2 = Fimageyr3.select('NDVI'); //Select NDVI values for End Year
    var diff = date2.subtract(date1); //Subtract rasters to get magnitude of change
    var trend = date2.lt(date1); //Creates a binary where pixels that have a lesser NDVI in year two are assigned a value of 1
    var final = trend.multiply(diff).clip(geometry); //Shows magnitude for less green trend

    Map.centerObject(geometry); // Center on AOI
    Map.addLayer(final, LG, 'Areas that have become less green(' + yr2 + ')-(' + yr3 + ')');
    Map.addLayer(date1, visNDVI, 'NDVI(' + yr2 + ')', false); //Creates a layer with the index in the Start Year.
    Map.addLayer(date2, visNDVI, 'NDVI(' + yr3 + ')', false); //Creates a layer with the index in the End Year.
  }

// Define the textbox for the 1st and 2nd year
var selectYr2 = ui.Textbox({placeholder: 'Year',  value: '1985',
  style: {width: '100px'}});
var selectYr3 = ui.Textbox({placeholder: 'Year',  value: '2018',
  style: {width: '100px'}});
// define the labels needed for GUI
var changepanel = ui.Label({
  value:'Select Years for Landsat 30m Change Map',
  style:{fontSize: '18px', fontWeight: 'bold'}});
var datasetRange_label2 = ui.Label('Start Year (1984 - )          ',
  {margin: '0 0 0 10px',fontSize: '12px',color: 'gray'});
var datasetRange_label3 = ui.Label('End Year (-2018)     ',
  {margin: '0 0 0 10px',fontSize: '12px',color: 'gray'});
// Create two buttons that will add the greener or lessGreen images to the map
var GRMAP = ui.Button('More Green Trend Map', GREENER);
var LGMAP = ui.Button('Less Green Trend Map', LESSGREEN);
// Add all elements to the panel in the correct order.
panel.add(changepanel)
  .add(ui.Panel([datasetRange_label2, datasetRange_label3],ui.Panel.Layout.flow('horizontal')))
  .add(ui.Panel([selectYr2, selectYr3],ui.Panel.Layout.flow('horizontal')))
  .add(GRMAP)
  .add(LGMAP);

var resetButton = ui.Button('Reset Map', reset);
panel.add(resetButton);

/*
Reset Map
*/
function reset(){
  Map.clear();
}