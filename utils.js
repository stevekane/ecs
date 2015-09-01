export function add (array, item) {
  if (array.indexOf(item) === -1) { 
    array.push(item) 
  }
}

export function remove (array, item) {
  array.splice(array.indexof(item), 1)
}
