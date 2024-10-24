const {BC, NSE} = require('./index');
const { DateTime } = require('luxon');
const nse = new BC("./");


async function testStatus() {
    try {
      // const result = await nse.equityBhavcopy(DateTime.now());
      const result = await nse.deliveryBhavcopy(DateTime.now(),"./");
      console.log(result);
    } catch (error) {
      console.error('Error:', error);
    }
  }
  
  testStatus();