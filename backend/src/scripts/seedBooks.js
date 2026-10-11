import "dotenv/config";
import path from "path";
import { fileURLToPath } from "url";
import mongoose from "mongoose";
import connectDB from "../config/db.js";
import Book from "../models/Book.js";

export const demoBooks = [
  // 1. Programming
  {
    title: "Clean Code: A Handbook of Agile Software Craftsmanship",
    author: "Robert C. Martin",
    isbn: "978-0132350884",
    category: "Programming",
    publicationYear: 2008,
    totalCopies: 8,
    availableCopies: 6
  },
  {
    title: "The Pragmatic Programmer: Your Journey To Mastery",
    author: "David Thomas, Andrew Hunt",
    isbn: "978-0135957059",
    category: "Programming",
    publicationYear: 2019,
    totalCopies: 7,
    availableCopies: 5
  },
  {
    title: "Structure and Interpretation of Computer Programs",
    author: "Harold Abelson, Gerald Jay Sussman",
    isbn: "978-0262510875",
    category: "Programming",
    publicationYear: 1996,
    totalCopies: 5,
    availableCopies: 3
  },
  {
    title: "Refactoring: Improving the Design of Existing Code",
    author: "Martin Fowler",
    isbn: "978-0134757599",
    category: "Programming",
    publicationYear: 2018,
    totalCopies: 6,
    availableCopies: 4
  },

  // 2. Computer Science
  {
    title: "Introduction to Algorithms",
    author: "Thomas H. Cormen, Charles E. Leiserson, Ronald L. Rivest, Clifford Stein",
    isbn: "978-0262046305",
    category: "Computer Science",
    publicationYear: 2022,
    totalCopies: 10,
    availableCopies: 8
  },
  {
    title: "Computer Systems: A Programmer's Perspective",
    author: "Randal E. Bryant, David R. O'Hallaron",
    isbn: "978-0134092669",
    category: "Computer Science",
    publicationYear: 2015,
    totalCopies: 6,
    availableCopies: 4
  },
  {
    title: "Operating System Concepts",
    author: "Abraham Silberschatz, Peter B. Galvin, Greg Gagne",
    isbn: "978-1119800361",
    category: "Computer Science",
    publicationYear: 2021,
    totalCopies: 8,
    availableCopies: 6
  },
  {
    title: "Computer Networking: A Top-Down Approach",
    author: "James F. Kurose, Keith W. Ross",
    isbn: "978-0136681557",
    category: "Computer Science",
    publicationYear: 2020,
    totalCopies: 7,
    availableCopies: 5
  },

  // 3. Databases
  {
    title: "Designing Data-Intensive Applications",
    author: "Martin Kleppmann",
    isbn: "978-1449373320",
    category: "Databases",
    publicationYear: 2017,
    totalCopies: 9,
    availableCopies: 7
  },
  {
    title: "Database System Concepts",
    author: "Abraham Silberschatz, Henry F. Korth, S. Sudarshan",
    isbn: "978-0078022159",
    category: "Databases",
    publicationYear: 2019,
    totalCopies: 6,
    availableCopies: 4
  },
  {
    title: "MongoDB: The Definitive Guide",
    author: "Shannon Bradshaw, Eoin Brazil, Kristina Chodorow",
    isbn: "978-1491954461",
    category: "Databases",
    publicationYear: 2019,
    totalCopies: 5,
    availableCopies: 3
  },
  {
    title: "High Performance PostgreSQL",
    author: "Gregory Smith",
    isbn: "978-1849510301",
    category: "Databases",
    publicationYear: 2018,
    totalCopies: 4,
    availableCopies: 2
  },

  // 4. Web Development
  {
    title: "Eloquent JavaScript: A Modern Introduction to Programming",
    author: "Marijn Haverbeke",
    isbn: "978-1593279509",
    category: "Web Development",
    publicationYear: 2018,
    totalCopies: 8,
    availableCopies: 6
  },
  {
    title: "Fullstack React: The Complete Guide to ReactJS and Friends",
    author: "Anthony Accomazzo, Ari Lerner, Nate Murray",
    isbn: "978-1728984926",
    category: "Web Development",
    publicationYear: 2020,
    totalCopies: 6,
    availableCopies: 5
  },
  {
    title: "Node.js Design Patterns",
    author: "Mario Casciaro, Luciano Mammino",
    isbn: "978-1839214110",
    category: "Web Development",
    publicationYear: 2020,
    totalCopies: 7,
    availableCopies: 5
  },
  {
    title: "Learning TypeScript: Enhance Your Web Development Skills",
    author: "Josh Goldberg",
    isbn: "978-1098110338",
    category: "Web Development",
    publicationYear: 2022,
    totalCopies: 5,
    availableCopies: 4
  },

  // 5. Artificial Intelligence
  {
    title: "Artificial Intelligence: A Modern Approach",
    author: "Stuart Russell, Peter Norvig",
    isbn: "978-0134610993",
    category: "Artificial Intelligence",
    publicationYear: 2020,
    totalCopies: 9,
    availableCopies: 7
  },
  {
    title: "Deep Learning",
    author: "Ian Goodfellow, Yoshua Bengio, Aaron Courville",
    isbn: "978-0262035613",
    category: "Artificial Intelligence",
    publicationYear: 2016,
    totalCopies: 6,
    availableCopies: 4
  },
  {
    title: "Pattern Recognition and Machine Learning",
    author: "Christopher M. Bishop",
    isbn: "978-0387310732",
    category: "Artificial Intelligence",
    publicationYear: 2006,
    totalCopies: 5,
    availableCopies: 3
  },
  {
    title: "Hands-On Machine Learning with Scikit-Learn, Keras, and TensorFlow",
    author: "Aurélien Géron",
    isbn: "978-1098125974",
    category: "Artificial Intelligence",
    publicationYear: 2022,
    totalCopies: 8,
    availableCopies: 6
  },

  // 6. Mathematics
  {
    title: "Linear Algebra and Its Applications",
    author: "Gilbert Strang",
    isbn: "978-0030105678",
    category: "Mathematics",
    publicationYear: 2006,
    totalCopies: 6,
    availableCopies: 5
  },
  {
    title: "Concrete Mathematics: A Foundation for Computer Science",
    author: "Ronald L. Graham, Donald E. Knuth, Oren Patashnik",
    isbn: "978-0201558029",
    category: "Mathematics",
    publicationYear: 1994,
    totalCopies: 5,
    availableCopies: 4
  },
  {
    title: "Discrete Mathematics and Its Applications",
    author: "Kenneth H. Rosen",
    isbn: "978-1259676512",
    category: "Mathematics",
    publicationYear: 2018,
    totalCopies: 7,
    availableCopies: 5
  },

  // 7. Literature
  {
    title: "1984",
    author: "George Orwell",
    isbn: "978-0451524935",
    category: "Literature",
    publicationYear: 1949,
    totalCopies: 6,
    availableCopies: 5
  },
  {
    title: "To Kill a Mockingbird",
    author: "Harper Lee",
    isbn: "978-0060935467",
    category: "Literature",
    publicationYear: 1960,
    totalCopies: 5,
    availableCopies: 4
  },
  {
    title: "The Great Gatsby",
    author: "F. Scott Fitzgerald",
    isbn: "978-0743273565",
    category: "Literature",
    publicationYear: 1925,
    totalCopies: 4,
    availableCopies: 3
  },
  {
    title: "Fahrenheit 451",
    author: "Ray Bradbury",
    isbn: "978-1451673319",
    category: "Literature",
    publicationYear: 1953,
    totalCopies: 5,
    availableCopies: 3
  },

  // 8. Business
  {
    title: "The Lean Startup: How Today's Entrepreneurs Use Continuous Innovation",
    author: "Eric Ries",
    isbn: "978-0307887894",
    category: "Business",
    publicationYear: 2011,
    totalCopies: 7,
    availableCopies: 5
  },
  {
    title: "Zero to One: Notes on Startups, or How to Build the Future",
    author: "Peter Thiel, Blake Masters",
    isbn: "978-0804139298",
    category: "Business",
    publicationYear: 2014,
    totalCopies: 6,
    availableCopies: 4
  },
  {
    title: "Good to Great: Why Some Companies Make the Leap... and Others Don't",
    author: "Jim Collins",
    isbn: "978-0066620992",
    category: "Business",
    publicationYear: 2001,
    totalCopies: 5,
    availableCopies: 4
  }
];

/**
 * Idempotently seeds demo books into MongoDB without modifying or removing existing records.
 * @param {Array} booksToSeed List of book objects to seed (defaults to demoBooks)
 * @returns {Promise<{totalTarget: number, insertedCount: number, skippedCount: number, alreadyExistedCount: number, totalInDb: number}>}
 */
export async function seedBooks(booksToSeed = demoBooks) {
  if (!Array.isArray(booksToSeed) || booksToSeed.length === 0) {
    throw new Error("No book records provided for seeding.");
  }

  if (mongoose.connection.readyState !== 1) {
    throw new Error("MongoDB connection is not open. Ensure connectDB() has resolved.");
  }

  // Verify internal uniqueness of seed dataset ISBNs
  const uniqueIsbns = new Set();
  for (const book of booksToSeed) {
    if (!book.isbn || typeof book.isbn !== "string") {
      throw new Error(`Book "${book.title || "Untitled"}" is missing a valid ISBN string.`);
    }
    const trimmedIsbn = book.isbn.trim();
    if (uniqueIsbns.has(trimmedIsbn)) {
      throw new Error(`Duplicate ISBN found in seed dataset: "${trimmedIsbn}".`);
    }
    uniqueIsbns.add(trimmedIsbn);
  }

  // Query existing ISBNs in the target collection
  const existingRecords = await Book.find({
    isbn: { $in: Array.from(uniqueIsbns) }
  })
    .select("isbn")
    .lean();

  const existingIsbnSet = new Set(existingRecords.map((doc) => doc.isbn.trim()));

  // Filter to records that do not already exist
  const missingBooks = booksToSeed.filter((book) => !existingIsbnSet.has(book.isbn.trim()));

  let insertedCount = 0;
  if (missingBooks.length > 0) {
    const insertedDocs = await Book.insertMany(missingBooks, { ordered: true });
    insertedCount = insertedDocs.length;
  }

  const skippedCount = booksToSeed.length - insertedCount;
  const totalInDb = await Book.countDocuments();

  return {
    totalTarget: booksToSeed.length,
    insertedCount,
    skippedCount,
    alreadyExistedCount: existingIsbnSet.size,
    totalInDb
  };
}

async function runSeedScript() {
  await connectDB();
  const dbName = mongoose.connection.name || "default";
  console.log(`Connected to database [${dbName}].`);

  const initialCount = await Book.countDocuments();
  console.log(`Pre-seed book count in collection: ${initialCount}.`);

  const result = await seedBooks(demoBooks);

  console.log("------------------------------------------");
  console.log("Preset Books Seeding Summary:");
  console.log(`- Target records in preset dataset: ${result.totalTarget}`);
  console.log(`- Newly inserted:                   ${result.insertedCount}`);
  console.log(`- Skipped (already existed):        ${result.skippedCount}`);
  console.log(`- Total book count now in database: ${result.totalInDb}`);
  console.log("------------------------------------------");
}

const currentFilePath = fileURLToPath(import.meta.url);
const invokedFilePath = process.argv[1] ? path.resolve(process.argv[1]) : "";

if (invokedFilePath === currentFilePath) {
  runSeedScript()
    .then(() => {
      console.log("Book catalogue seed process completed successfully.");
    })
    .catch((error) => {
      console.error("Book catalogue seed process failed:", error.message);
      process.exitCode = 1;
    })
    .finally(async () => {
      if (mongoose.connection.readyState !== 0) {
        await mongoose.disconnect();
      }
    });
}
