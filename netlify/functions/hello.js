exports.handler = async (event, context) => {
  return {
    statusCode: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      message: 'CrawlMapper Functions are working!',
      timestamp: new Date().toISOString(),
      version: '2.1.0'
    })
  };
};