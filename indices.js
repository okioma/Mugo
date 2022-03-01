// Compute Normalized Difference Vegetation Index over S2-L2 product.
// NDVI = (NIR - RED) / (NIR + RED), where
// RED is B4, 664.5 nm
// NIR is B8, 835.1 nm

//Step 1: Access your boundary-defining geometry
var transzoia = ee.FeatureCollection("users/mautiharonokioma/kwanza_constituency")

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


//Step 2: Access the Sentinel-2 Level-2A data and filter it for all the the images of the year 2020 that lie within the geometries boundaries. Keep only the relevant bands and filter for cloud coverage.
var s2a = ee.ImageCollection('COPERNICUS/S2')
                  .filterBounds(transzoia)
                  .filterDate('2019-06-01', '2019-07-31')
                  .select('B1','B2','B3','B4','B5','B6','B7','B8','B8A','B9','B11','B12')
                  .filter(ee.Filter.lt('CLOUDY_PIXEL_PERCENTAGE', 10))
                  //.map(mask2Cloud);

//Print your ImageCollection to your console tab to inspect it
print(s2a, 'Image Collection Transzoia July 2020');
Map.centerObject(transzoia,9)


//Step 3: Create a single Image by reducing by Median and clip it to the extent of the geometry
var s2a_median = s2a.median()
                    .clip(transzoia);

//Print your Image to your console tab to inspect it
print(s2a_median, 'Median reduced Image Transzoia July 2019');

//Add your Image as a map layer
var visParams = {min: 400,max: 3000,   bands:['B4','B3','B2']};
Map.addLayer(s2a_median, visParams, 'S2 Transzoia July 2019 Median');// Compute Normalized Difference Vegetation Index over S2-L2 product.
// NDVI = (NIR - RED) / (NIR + RED), where
// RED is B4, 664.5 nm
// NIR is B8, 835.1 nm


//Step 4: Calculate the NDVI manually: NDVI = (B8 - B4) / (B8 + B4)
//this can be achieved using either simple band operations, .expression or .normalizedDifference

// Display the result.
var ndviParams = {min: -1, max: 1, palette: ['blue', 'white', 'green']};

//Variant  for calculating NDVI: .expression
var ndvi_2 = s2a_median.expression(
                      '(NIR-RED)/(NIR+RED)', {
                        'NIR' : s2a_median.select('B8'),
                        'RED' : s2a_median.select('B4')
                      })
                      .rename('NDVI');

print(ndvi_2, 'NDVI Transzoia ')

//Display the result
Map.addLayer(ndvi_2, ndviParams , 'NDVI Transzoia ');
/*
//Variant 3: .normalizedDifference(NIR, RED)
//find out how .normalizedDifference works by checking Docs -> ee.Image -> normalizedDifference
var ndvi_3 = s2a_median.normalizedDifference(['B8', 'B4'])
                      .rename('NDVI');
print(ndvi_3, 'NDVI Transzoia July 2020 V3');


*/
//You can also create more complex colour palettes via hex strings.
//this color combination is taken from the Examples script Image -> Normalized Difference:
var palette = ['FFFFFF', 'CE7E45', 'DF923D', 'F1B555', 'FCD163', '99B718',
               '74A901', '66A000', '529400', '3E8601', '207401', '056201',
               '004C00', '023B01', '012E01', '011D01', '011301'];
//Please keep in mind that for this palette, you should set your minimum visible value to 0, as it s designed for this purpose.
//This is due to it being a gradient from brown to green tones, with a heavy focus on the green side. If we would set min: -1, NDVI = 0 would already be displayed in a dark green tone.
//You can recognize this by checking the palette-section of your layer information for ndvi_3.

// Display the input image and the NDVI derived from it.
//Map.addLayer(ndvi_3, {min: 0, max: 1, palette: palette}, 'NDVI Transzoia July 2020 V3')

//calculating SLAVI using expression (NIR/(Red+SWIR2)
var swir2=s2a_median.select('B12');

var SLAVI = s2a_median.expression(
                      '(NIR/(RED+SWIR2))', {
                        'NIR' : s2a_median.select('B8'),
                        'RED' : s2a_median.select('B4'),
                        'SWIR2' : s2a_median.select('B12')
                      })
                      .rename('SLAVI');
                      
print(SLAVI,'SLAVI value')
Map.addLayer(SLAVI,{palette:['red','green','blue'],min:0,max:10},'SLAVI Layer')



// calculating Soil and Atmospherically Resistant Vegetation Index
var blue=s2a_median.select('B2');

var SARVI = s2a_median.expression(
                      '((NIR-(Red-1*(Blue-Red)))/(NIR+(Red-1*(Blue-Red))))*(1+0.5)', {
                        'NIR' : s2a_median.select('B8'),
                        'Red' : s2a_median.select('B4'),
                        'Blue' : s2a_median.select('B2')
                      })
                      .rename('SARVI');
                      
print(SARVI,'SARVI value')
Map.addLayer(SARVI,{palette:['white','red'],min:0,max:10},'SARVI Layer')


//calculating NPCRI using expression (RED-BLUE)/(RED+BLUE)


var NPCRI = s2a_median.expression(
                      '((RED-blue)/(RED+blue))', {
                        'RED' : s2a_median.select('B4'),
                        'blue' : s2a_median.select('B2')
                      })
                      .rename('NPCRI');
                      
print(NPCRI,'NPCRI value')
Map.addLayer(NPCRI,{palette:['#e5f5f9','#99d8c9','#2ca25f'],min:0,max:10},'NPCRI Layer')



// calculating SCI




var SCI = s2a_median.expression(
                      '((SWIR1-NIR)/(SWIR1+NIR))', {
                        'NIR' : s2a_median.select('B8'),
                        'SWIR1' : s2a_median.select('B12')
                      })
                      .rename('SCI');
                      
print(SCI,'SCI value')
Map.addLayer(SCI,{palette:['#efedf5','#bcbddc','#756bb1'],min:0,max:10},'SCI Layer')

var swir1=s2a_median.select('B11');

var NDMI = s2a_median.expression(
                      '(NIR-SWIR1/(NIR+SWIR1))', {
                        'NIR' : s2a_median.select('B8'),
                        'SWIR1' : s2a_median.select('B11')
                      })
                      .rename('NDMI');
                      
print(NDMI,'NDMI value')
Map.addLayer(NDMI,{palette:['#e7e1ef','#c994c7','#dd1c77'],min:0,max:10},'NDMI Layer')

//calculating EVI_2
var EVI_2 = s2a_median.expression(
                      '(2.5*(NIR-RED))/(NIR+C2*Blue+1)', {
                        'NIR' : s2a_median.select('B8'),
                        'RED' : s2a_median.select('B4'),
                        'Blue' : s2a_median.select('B2'),
                        'C2' :7.5
                      })
                      .rename('EVI_2');
                      
print(EVI_2,'EVI_2 value')
Map.addLayer(EVI_2,{palette:['#fff7bc','#fec44f','#d95f0e'],min:0,max:10},'EVI_2 Layer')


