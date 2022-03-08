// Compute Normalized Difference Vegetation Index over S2-L2 product.
// NDVI = (NIR - RED) / (NIR + RED), where
// RED is B4, 664.5 nm
// NIR is B8, 835.1 nm

//Step 1: Access your boundary-defining geometry
var ROI1 = ee.FeatureCollection("users/mautiharonokioma/Namandala")

//cloud masking
function maskS2clouds(image){
    return image.updateMask(image.select('QA60').eq(0));
}


//Step 2: Access the Sentinel-2 Level-2A data and filter it for all the the images of the year 2020 that lie within the geometries boundaries. Keep only the relevant bands and filter for cloud coverage.
var s2a = ee.ImageCollection('COPERNICUS/S2')
                  .filterBounds(ROI)
                  .filterDate('2019-06-01', '2019-07-31')
                  //.select('B1','B2','B3','B4','B5','B6','B7','B8','B8A','B9','B11','B12')
                  //.filter(ee.Filter.lt('CLOUDY_PIXEL_PERCENTAGE', 10))
                  .map(maskS2clouds);

//Print your ImageCollection to your console tab to inspect it
print(s2a, 'Image Collection Transzoia ');
Map.centerObject(ROI,15)


//Step 3: Create a single Image by reducing by Median and clip it to the extent of the geometry
var image1 = s2a.median()
                    .clip(ROI);

//Print your Image to your console tab to inspect it
print(image1, 'Median reduced Image Transzoia ');

//Add your Image as a map layer
var visParams = {min: 400,max: 3000,   bands:['B4','B3','B2']};
Map.addLayer(image1, visParams, 'S2 Transzoia  Median');// Compute Normalized Difference Vegetation Index over S2-L2 product.
// NDVI = (NIR - RED) / (NIR + RED), where
// RED is B4, 664.5 nm
// NIR is B8, 835.1 nm


//Variant 3: .normalizedDifference(NIR, RED)
//find out how .normalizedDifference works by checking Docs -> ee.Image -> normalizedDifference
var ndvi_3 = image1.normalizedDifference(['B8', 'B4'])
                      .rename('NDVI');
print(ndvi_3, 'NDVI Transzoia July 2020 V3');



//You can also create more complex colour palettes via hex strings.
//this color combination is taken from the Examples script Image -> Normalized Difference:
var palette = ['FFFFFF', 'CE7E45', 'DF923D', 'F1B555', 'FCD163', '99B718',
               '74A901', '66A000', '529400', '3E8601', '207401', '056201',
               '004C00', '023B01', '012E01', '011D01', '011301'];
//Please keep in mind that for this palette, you should set your minimum visible value to 0, as it s designed for this purpose.
//This is due to it being a gradient from brown to green tones, with a heavy focus on the green side. If we would set min: -1, NDVI = 0 would already be displayed in a dark green tone.
//You can recognize this by checking the palette-section of your layer information for ndvi_3.

// Display the input image and the NDVI derived from it.
Map.addLayer(ndvi_3, {min: 0, max: 1, palette: palette}, 'NDVI Transzoia July 2020 V3')

//calculating SLAVI using expression (NIR/(Red+SWIR2)
var truecolor = {
  min:0,
  max: 3000,
  bands: ['B4','B3','B2'],
}; 

var NIR= image1.select('B8');
var red= image1.select('B4');
var NDVI=NIR.subtract(red).divide(NIR.add(red));
Map.addLayer(NDVI,{palette:['white','green']},'NDVI');
Map.addLayer(image1,truecolor,'sentinel_2');

var meanNDVI= NDVI.reduceRegion({
  reducer: ee.Reducer.mean(),
  geometry: ROI,
  scale: 10,
  //maxPixels: 1e9
});

print('NDVI mean',meanNDVI);
print(NDVI);

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
  //maxPixels: 1e9
});

print('SARVI mean',meanSARVI);
Map.addLayer(SARVI,{palette:['white','red'],min:0,max:10},'SARVI Layer')


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
  //maxPixels: 1e9
});

print('NPCRI mean',meanNPCRI);
Map.addLayer(NPCRI,{palette:['#e5f5f9','#99d8c9','#2ca25f'],min:0,max:10},'NPCRI Layer')

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
  //maxPixels: 1e9
});

print('NDMI mean',meanNDMI);
Map.addLayer(NDMI,{palette:['00FFFF', '0000FF'],min:0,max:10},'NDMI Layer')

//calculating EVI_2
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
  //maxPixels: 1e9
});

print('EVI_2 mean',meanEVI_2);
Map.addLayer(EVI_2,{palette:['#fff7bc','#fec44f','#d95f0e'],min:0,max:10},'EVI_2 Layer')

var RVI = image1.expression(
                      '(NIR/RED)', {
                        'NIR' : image1.select('B8'),
                        'RED' : image1.select('B4')})
                      .rename('RVI');
                      
var meanRVI= RVI.reduceRegion({
  reducer: ee.Reducer.mean(),
  geometry: ROI,
  scale: 10,
  //maxPixels: 1e9
});

print('RVI mean',meanRVI);
Map.addLayer(RVI,{palette:['#fff7bc','#fec44f','#d95f0e'],min:0,max:10},'RVI Layer')

var GCI = image1.expression(
                      '(NIR/Green-1)', {
                        'NIR' : image1.select('B8'),
                        'Green' : image1.select('B3')})
                      .rename('GCI');
                      
var meanGCI= GCI.reduceRegion({
  reducer: ee.Reducer.mean(),
  geometry: ROI,
  scale: 10,
  //maxPixels: 1e9
});

print('GCI mean',meanGCI);
Map.addLayer(GCI,{palette:['#fff7bc','#fec44f','#d95f0e'],min:0,max:10},'GCI Layer')


var area=ROI.area().divide(1e6).multiply(100);
print(area);

var YieldProduction = 
  image1.expression('((W1*NDVI)+(W2*SARVI)+(W3*NPCRI)+(W4*RVI)+(W5*GCI))*area',{
  'NDVI':meanNDVI,
  'NPCRI':meanNPCRI,
  'RVI':meanRVI,
  'GCI':meanGCI,
  'SARVI':meanSARVI,
  
  'W1':48738.46,
  'W2':10277.25,
  'W3':-675275.71,
  'W4':-503790.75,
  'W5':1018458.09,
  'area':area
});

