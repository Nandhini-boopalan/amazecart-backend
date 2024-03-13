class APIFeatures {
    constructor(query, queryStr) {
       this.query = query;
       this.queryStr = queryStr;
    }

    search() {
        const keyword = this.queryStr.keyword ? {
            name: {
                $regex: this.queryStr.keyword,
                $options: 'i'
            }
        } : {};
        
        this.query = this.query.find({ ...keyword }); // Update the query property
        return this; // Return this instance for chaining
    }
    filter() {
        if (!this.query) {
            throw new Error("Query is not initialized");
        }
    
        const queryStrCopy = { ...this.queryStr };
    
        // Removing fields from queryStrCopy
        const removeFields = ['keyword', 'limit', 'page'];
        removeFields.forEach(field => delete queryStrCopy[field]);
    
        // Convert comparison operators to MongoDB syntax
        Object.keys(queryStrCopy).forEach(key => {
            if (['gt', 'gte', 'lt', 'lte'].includes(key)) {
                queryStrCopy[key] = { [`$${key}`]: queryStrCopy[key] };
            }
        });
    
        console.log("Modified queryStrCopy:", queryStrCopy);
    
        let queryStr = JSON.stringify(queryStrCopy);
        queryStr = queryStr.replace(/\b(gt|gte|lt|lte)/g, match => `$${match}`);
    
        console.log("Parsed query string:", queryStr);
    
        // Apply the modified queryStr to the query and update this.query
        this.query = this.query.find(JSON.parse(queryStr));
    
        //console.log("Updated query:", this.query);
    
        return this;
    }
    
    paginate() {
        const resPerPage = 2; // Define the number of items per page
        const currentPage = Number(this.queryStr.page) || 1;
        const skip = resPerPage * (currentPage - 1);
        this.query = this.query.limit(resPerPage).skip(skip);
        return this;
    }
    
    
}

module.exports = APIFeatures;
