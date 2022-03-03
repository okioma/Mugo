
//Step 1: Access your boundary-defining geometry
var ROI1 = ee.FeatureCollection("users/mautiharonokioma/Namandala");

//importing of chirps precipitation data
var image = ee.ImageCollection('UCSB-CHG/CHIRPS/PENTAD');

var clipcollection = image.map(function(image){
  return image.clip(ROI);
});

//we fiter the image collection to our specified date 
var filtered = clipcollection
.filter(ee.Filter.calendarRange(1992,2012,'year'))
.filter(ee.Filter.calendarRange(3,7,'month'))
;
  
var total = filtered.reduce(ee.Reducer.sum());

var rainVis =
{
  bands:['precipitation_sum'],
  palette:['#ffffcc','#a1dab4','#41b6c4','#2c7fb8','#253494'],
  min:0,
  max:2000,

};

Map.addLayer(total,rainVis,'precipitation',false);
  
  Map.addLayer(filtered,{ bands:['precipitation'],
  palette:['#ffffcc','#a1dab4','#41b6c4','#2c7fb8','#253494']},'precipitation',false);

//cloud masking


function mask2Cloud(image){
  var qa = image.select('QA60');
  //bits 10 and 11 are clouds and cirrus respectively
  var cloudsBitMask= 1<<10;
  var cirrusBitMask=1<<11;
  //Both flags should be set to zero to show a free condition
  var mask=qa.bitwiseAnd(cloudsBitMask).eq(0)
  .and(qa.bitwiseAnd(cirrusBitMask).eq(0));
  return image.updateMask(mask).divide(10000);
  
}


//Step 2: Access the Sentinel-2 Level-2A data and filter it for all the the images 
var s2a = imageCollection
                  .filterBounds(ROI)
                  .filterDate('2020-06-01', '2020-07-31')
                  //.select('B1','B2','B3','B4','B5','B6','B7','B8','B8A','B9','B11','B12')
                  .filter(ee.Filter.lt('CLOUDY_PIXEL_PERCENTAGE', 10))
                  .map(mask2Cloud);

//Print your ImageCollection to your console tab to inspect it
print(s2a, 'Image Collection Transzoia ');
Map.centerObject(ROI,15);


//Step 3: Create a single Image by reducing by Median and clip it to the extent of the geometry
var image1 = s2a.median()
                    .clip(ROI);

//Print your Image to your console tab to inspect it
print(image1, 'Median reduced Image Transzoia ');

//Add your Image as a map layer
var visParams = {min:0,max: 0.35,   bands:['B4','B3','B2']};
Map.addLayer(image1, visParams, 'S2 Transzoia  Median',false);
// Compute Normalized Difference Vegetation Index over S2-L2 product.
// NDVI = (NIR - RED) / (NIR + RED), where
// RED is B4, 664.5 nm
// NIR is B8, 835.1 nm



//calculating NDVI using expression (NIR-red/(NIR+Red)
var truecolor = {
  min:0,
  max: 0.35,
  bands: ['B4','B3','B2'],
}; 

var NIR= image1.select('B8');
var red= image1.select('B4');
var NDVI=NIR.subtract(red).divide(NIR.add(red));
Map.addLayer(NDVI,{palette:['white','green']},'NDVI');
Map.addLayer(image1,truecolor,'sentinel_2',false);

var meanNDVI= NDVI.reduceRegion({
  reducer: ee.Reducer.mean(),
  geometry: ROI,
  scale: 10,

});

print('NDVI mean',meanNDVI);
print(NDVI);
//soil and atmospherically resistant vegetation index
var SARVI = image1.expression(
                      '((NIR-(Red-1*(Blue-Red)))/(NIR+(Red-1*(Blue-Red))))*(1+0.5)', {
                        'NIR' : image1.select('B8'),
                        'Red' : image1.select('B4'),
                        'Blue' : image1.select('B2')
                      })
                      .rename('SARVI');
var meanSARVI= SARVI.reduceRegion({
  reducer: ee.Reducer.mean(),
  geometry: ROI,
  scale: 10,

});

print('SARVI mean',meanSARVI);
Map.addLayer(SARVI,{palette:['white','red'],min:0,max:10},'SARVI Layer',false);

//normalized pigment chlorophyll ratio index
//calculating NPCRI using expression (RED-BLUE)/(RED+BLUE)


var NPCRI = image1.expression(
                      '((RED-blue)/(RED+blue))', {
                        'RED' : image1.select('B4'),
                        'blue' : image1.select('B2')
                      })
                      .rename('NPCRI');
                      
var meanNPCRI= NPCRI.reduceRegion({
  reducer: ee.Reducer.mean(),
  geometry: ROI,
  scale: 10,
  
});

print('NPCRI mean',meanNPCRI);
Map.addLayer(NPCRI,{palette:['#e5f5f9','#99d8c9','#2ca25f'],min:0,max:10},'NPCRI Layer',false);

// normalized difference moisture index
var NDMI = image1.expression(
                      '(NIR-SWIR1)/(NIR+SWIR1)', {
                        'NIR' : image1.select('B8'),
                        'SWIR1' : image1.select('B11')
                      })
                      .rename('NDMI');
                      
var meanNDMI= NDMI.reduceRegion({
  reducer: ee.Reducer.mean(),
  geometry: ROI,
  scale: 10,

});

print('NDMI mean',meanNDMI);
Map.addLayer(NDMI,{palette:['00FFFF', '0000FF'],min:0,max:10},'NDMI Layer',false)

//enhanced vegetation index
//calculating EVI_2
// c2 being aerosal constants
var EVI_2 = image1.expression(
                      '(2.5*(NIR-RED))/(NIR+C2*Blue+1)', {
                        'NIR' : image1.select('B8'),
                        'RED' : image1.select('B4'),
                        'Blue' : image1.select('B2'),
                        'C2' :7.5
                      })
                      .rename('EVI_2');
                      
var meanEVI_2= EVI_2.reduceRegion({
  reducer: ee.Reducer.mean(),
  geometry: ROI,
  scale: 10,

});

print('EVI_2 mean',meanEVI_2);
Map.addLayer(EVI_2,{palette:['#fff7bc','#fec44f','#d95f0e'],min:0,max:10},'EVI_2 Layer',false);

//ratio vegetation index

var RVI = image1.expression(
                      '(NIR/RED)', {
                        'NIR' : image1.select('B8'),
                        'RED' : image1.select('B4')})
                      .rename('RVI');
                      
var meanRVI= RVI.reduceRegion({
  reducer: ee.Reducer.mean(),
  geometry: ROI,
  scale: 10,
  
});

print('RVI mean',meanRVI);
Map.addLayer(RVI,{palette:['#fff7bc','#fec44f','#d95f0e'],min:0,max:10},'RVI Layer',false);

//green chlorophyll index
var GCI = image1.expression(
                      '(NIR/Green-1)', {
                        'NIR' : image1.select('B8'),
                        'Green' : image1.select('B3')})
                      .rename('GCI');
                      
var meanGCI= GCI.reduceRegion({
  reducer: ee.Reducer.mean(),
  geometry: ROI,
  scale: 10,

});

print('GCI mean',meanGCI);
Map.addLayer(GCI,{palette:['#fff7bc','#fec44f','#d95f0e'],min:0,max:10},'GCI Layer',false);

//prediction  of maize production using different indices
//where a,b,c,d,e,f are weights

var YieldPrediction = image1.expression('a(NDVI)+b(NDMI)+c(NPCRI)+d(RVI)+e(GCI)+f(SARVI)',{
  'NDVI':meanNDVI,
  'NDMI':meanNDMI,
  'NPCRI':meanNPCRI,
  'RVI':meanRVI,
  'GCI':meanGCI,
  'SARVI':meanSARVI,
  
});
