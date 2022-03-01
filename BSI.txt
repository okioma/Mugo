//calculating Bare soil Index
var BSI = s2a_median.expression(
                      '((SWIR1+RED)-(NIR+Blue))/((SWIR1+RED)+(NIR+Blue))', {
                        'NIR' : s2a_median.select('B8'),
                        'RED' : s2a_median.select('B4'),
                        'Blue' : s2a_median.select('B2'),
                        'SWIR1' :s2a_median.select('B11')
                      })
                      .rename('BSI');
                      
print(BSI,'BSI value')
Map.addLayer(BSI,{palette:['#fff7bc','#fec44f'],min:0,max:10},'BSI Layer')
