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

async function removeScene(uid){
  return new Promise((resolve, reject) => {
    fetch('/api/remove', {
      method: 'POST', headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({
        uid: uid
      }),
		})
    .then(response => response.json())
    .then(data => resolve(data))
    .catch(err => {
      reject(err)
    })
  })
}

export {queryScenes, removeScene}