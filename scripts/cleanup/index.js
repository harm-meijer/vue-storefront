const fs = require('fs-extra');
const glob = require('glob');
const { exit } = require('process');

const filter = (arr) => {
  const recursiveFilter = (arr, index)=>{
    if (arr.length === index - 1) {
      return arr;
    }
    const currentItem = arr[index];
    const newArray = arr
      .slice(0, index + 1)
      .concat(
        arr.slice(index + 1).filter(
          (p)=>
            p.indexOf(currentItem) !== 0
        )
      );
    return recursiveFilter(newArray, index + 1);
  };
  return recursiveFilter(arr, 0);
};

glob('**/node_modules/', (er, files) => {
  if (er) {
    console.error(er);
    exit(1);
  }
  filter(
    files.filter(f=>!f.includes('scripts/cleanup'))
  ).forEach(
    dir=>
      fs.remove(dir, { recursive: true }, (err) => {
        if (err) {
          throw err;
        }
        console.log(`${dir} is deleted!`);
      })
  );
});
