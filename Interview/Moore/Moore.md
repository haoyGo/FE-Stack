## 摩尔算法
求出投票数超过一般的选票

通过消除法，每两个不同的元素相互抵消，最后剩下的就是最大选票。
最差情况是，每次抵消都含有最大选票，但因为最大选票数量大于一半，所以剩下的还会是最大选票。

``` javascript
const majorityElement = function(nums) {
    let major, count = 0
    for (const num of nums) {
        if (!count) {
            major = num
            count++
        } else if (major === num) {
            count++    
        } else {
            count--
        }
    }
    
    return major
}
```