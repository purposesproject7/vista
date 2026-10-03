import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

import Student from './models/studentSchema.js';
import Marks from './models/marksSchema.js';

mongoose.connect(process.env.MONGODB_URI).then(async () => {
  const marks = await Marks.find({ remarks: /\[PAT\]/i });
  console.log('Found', marks.length, 'PAT marks');
  for (let m of marks) {
    await Student.findByIdAndUpdate(m.student, { PAT: true });
  }
  console.log('Fixed students');
  process.exit();
});
