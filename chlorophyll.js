var S2=ee.ImageCollection("COPERNICUS/S2")
.filterDate('2019-6-1','2019-6-30')
.filterBounds(ROI)
.sort('CLOUD_ASSESMENT')
.first()
.clip(ROI);
var vis ={
  min:0,
  max:3000,
  //bands:['B6','B5','B4'],
  palette:['blue','green']
};

var B6 = S2.select('B6');
var B5 = S2.select('B5');
var B4 = S2.select('B4');
var chl=(B6.add(B5)).divide(B4);
Map.addLayer(chl,vis,'chlorophyl concentration');


var chlorophyll=chl.reduceRegion({
  reducer:ee.Reducer.mean(),
  geometry:ROI,
  scale:30,
  
});
print('Chlorophyll conentration',chlorophyll);
