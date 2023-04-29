const mongoose = require('mongoose')
const validator = require('validator')
const slugify = require('slugify')
const geoCoder = require('../utils/geocoder')

const jobSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Please enter job title.'],
    trim: true,
    maxlength: [100, 'Job title cannot exceed 100 characters.']
  },
  slug: String,
  description: {
    type: String,
    required: [true, 'Please enter job description.'],
    maxlength: [1000, 'Job description cannot exceed 1000 characters.']
  },
  email: {
    type: String,
    validate: [validator.isEmail, 'Please enter valid email address.']
  },
  address: {
    type: String,
    required: [true, 'Please add an address.']
  },
  location: {
    type: {
      type: String,
      enum: ['Point']
    },
    coordinates: {
      type: [Number],
      index: '2dsphere'
    },
    formattedAdress: String,
    city: String,
    state: String,
    zipcode: String,
    country: String
  },
  company: {
    type: String,
    required: [true, 'Please add a company name.']
  },
  industry: {
    type: [String],
    required: [true, 'Please enter industry for this job'],
    enum: {
      values: [
        'Business',
        'Information Technology',
        'Banking',
        'Education/Training',
        'Telecommunication',
        'Others'
      ],
      message: 'Please select correct options for industry.'
    }
  },
  jobType: {
    type: String,
    required: [true, 'Please enter job type.'],
    enum: {
      values: [
        'Permanent',
        'Temporary',
        'Internship'
      ],
      message: 'Please select correct option for job type.'
    }
  },
  minEducation: {
    type: String,
    required: [true, 'Please enter minimum education.'],
    enum: {
      values: [
        'Bachelors',
        'Master',
        'PhD'
      ],
      message: 'Please select correct option for education.'
    }
  },
  positions: {
    type: Number,
    default: 1
  },
  experience: {
    type: String,
    required: [true, 'Please enter exerience required for this job.'],
    enum: {
      values: [
        'No Experience',
        '1 year - 2 years',
        '2 years - 5 years',
        '5 years +'
      ],
      message: 'Please select correct option for experience'
    }
  },
  salary: {
    type: Number,
    require: [true, 'Please enter expected salary for this job']
  },
  postingDate: {
    type: Date,
    default: Date.now
  },
  lastDate: {
    type: Date,
    default: new Date().setDate(new Date().getDate() + 7)
  },
  applicantsApplied: {
    type: [Object],
    select: false,
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
})

// Creating slug before saving & updating to DB
jobSchema.pre('save', function (next) {
  this.slug = slugify(this.title, { lower: true })
  next()
})

jobSchema.pre(['updateOne', 'findOneAndUpdate'], async function (next) {
  const job = await this.model.findOne(this.getQuery());
  const slug = slugify(job.title, { lower: true })
  this.set({ slug })
  next()
})

// Setting up Location
jobSchema.pre('save', async function (next) {
  const loc = await geoCoder.geocode(this.address);

  this.location = {
    type: 'Point',
    coordinates: [loc[0].longitude, loc[0].latitude],
    formattedAddress: loc[0].formattedAddress,
    city: loc[0].city,
    state: loc[0].stateCode,
    zipcode: loc[0].zipcode,
    country: loc[0].countryCode
  }

  next()
});

module.exports = mongoose.model('Job', jobSchema)