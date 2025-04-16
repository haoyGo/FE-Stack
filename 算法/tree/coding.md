``` js
var data = [{
  id: 1,
  children: [{
    id: 2,
    children: [{
      id: 3
    }, {
      id: 4
    }]
  }]
}];

var find = id => {
    // some code
  const stack = []
  const traverse = (list) => {
    for (node of list) {
      stack.push(node.id)
      if (node.id === id) {
        return true
      }
      if (Array.isArray(node.children) && traverse(node.children)) {
        return true
      }
      stack.pop()
    }
    return false
  }

  traverse(data)

  return stack
}
find(4) // [1,2,4]
```