async function queryScenes(){
  return new Promise((resolve, reject) => {
    fetch('/api/retrieve')
    .then(response => response.json())
    .then(data => resolve(data))
    .catch(err => {
      reject(err)
    })
  })
}


export {queryScenes}