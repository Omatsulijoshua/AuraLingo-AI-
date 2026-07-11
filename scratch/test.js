const url = 'https://bandup-ielts.onrender.com/api/subscriptions/history';
fetch(url)
  .then(res => {
    console.log('STATUS:', res.status);
    return res.text();
  })
  .then(text => {
    console.log('BODY:', text.substring(0, 500));
  })
  .catch(err => {
    console.error('ERROR:', err);
  });
