// replace 'null' or 'undefined' values with undefined/null
export function replaceNullUndefined<T>(obj: T): T {
	const newObj = { ...obj } as any
	for (const key in newObj) {
		if (newObj[key] === 'null') {
			newObj[key] = null
		} else if (newObj[key] === 'undefined') {
			newObj[key] = undefined
		}
	}
	return newObj
}

// replace 'null' or 'undefined' values with undefined
export function replaceNullUndefinedWithUndefined<T>(obj: T): T {
	const newObj = { ...obj } as any
	for (const key in newObj) {
		if (newObj[key] === 'null') {
			newObj[key] = undefined
		} else if (newObj[key] === 'undefined') {
			newObj[key] = undefined
		}
	}
	return newObj
}
