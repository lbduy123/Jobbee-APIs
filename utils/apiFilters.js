class APIFilters {
  constructor(query, queryFilter) {
    this.query = query
    this.queryFilter = queryFilter
  }

  filter = () => {
    const queryCopy = { ...this.queryFilter }
    const removeQuery = ['sort', 'fields', 'q', 'limit', 'page']
    removeQuery.forEach(query => delete queryCopy[query])

    // Advanced filters using: lt, lte, gt, gte
    let queryFilter = JSON.stringify(queryCopy)
    queryFilter = queryFilter.replace(/\b(lt|lte|gt|gte)\b/g, match => `$${match}`)
    console.log(queryFilter, this.queryFilter)

    this.query = this.query.find(JSON.parse(queryFilter));

    return this
  }

  sort() {
    if (this.queryFilter.sort) {
      const sortBy = this.queryFilter.sort.split(',').join(' ')
      this.query = this.query.sort(sortBy)
    } else {
      this.query = this.query.sort('-postingDate')
    }

    return this
  }

  limitFields() {
    if (this.queryFilter.fields) {
      const fields = this.queryFilter.fields.split(',').join(' ')
      this.query = this.query.select(fields)
    } else {
      this.query = this.query.select('-__v')
    }

    return this
  }

  searchByQuery() {
    if (this.queryFilter.q) {
      const q = this.queryFilter.q.split('-').join(' ')
      console.log(q);
      this.query = this.query.find({ $text: { $search: "\"" + q + "\"" } })
    }

    return this
  }

  pagination() {
    const limit = parseInt(this.queryFilter.limit) || 10
    const page = parseInt(this.queryFilter.page) || 1
    const offset = (page - 1) * limit

    this.query = this.query.skip(offset).limit(limit)

    return this
  }
}

module.exports = APIFilters