// @flow

/*::
import type { Callback } from "./data.js"
*/

export const passback = /*::<x, a>*/ (
  call /*:(Callback<x, a>) => mixed*/
) /*:Promise<a>*/ =>
  new Promise((resolve, reject) => {
    call((error, ok) => {
      if (error) {
        reject(error)
      } else {
        resolve(ok)
      }
    })
  })
