process.env.NODE_ENV = "test";
const request = require("supertest");
const app = require("../app");
const db = require("../db");

let testBookOne;
let testBookTwo;
beforeAll(async function () {
  let resultOne = await db.query(
    `INSERT INTO books(isbn, amazon_url, author, language, pages, publisher, title, 
year) 
VALUES($1, $2, $3, $4, $5, $6, $7, $8)
RETURNING isbn, amazon_url, author, language, pages, publisher, title, year`,
    [
      "123321",
      "www.amazon/book1.com",
      "Test McTesty",
      "English",
      123,
      "Test Publishers",
      "Tests for Testy Test Takers",
      2019,
    ]
  );
  testBookOne = resultOne.rows[0];

  let resultTwo = await db.query(
    `
    INSERT INTO books(isbn, amazon_url, author, language, pages, publisher, title, year) 
    VALUES($1, $2, $3, $4, $5, $6, $7, $8)
    RETURNING isbn, amazon_url, author, language, pages, publisher, title, year`,
    [
      "456654",
      "www.amazon/book2.com",
      "Testa McTessa",
      "Pig Latin",
      456,
      "test books inc",
      "Second Test Book",
      1987,
    ]
  );
  testBookTwo = resultTwo.rows[0];
});

afterAll(async function () {
  await db.query("DELETE FROM books");
  await db.end();
});

/** GET ALL BOOKS / => {books: [book, ...]}  */

describe("GET ALL /books", function () {
  test("Gets an array of books", async function () {
    const response = await request(app).get(`/books`);
    expect(response.statusCode).toEqual(200);
    expect(response.body).toHaveProperty("books");
    expect(response.body.books).toContainEqual(testBookOne);
    expect(response.body.books).toContainEqual(testBookTwo);
    expect(response.body.books.length).toEqual(2);
  });
});

/** GET /[id]  => {book: book} */

describe("GET data about one book /books/:isbn", function () {
  test("Gets a single book", async function () {
    const response = await request(app).get(`/books/${testBookOne.isbn}`);
    expect(response.statusCode).toEqual(200);
    expect(response.body).toHaveProperty("book");
    expect(response.body).toEqual({ book: testBookOne });
  });

  test("Responds with 404 if can't find book", async function () {
    const response = await request(app).get(`/books/0`);
    expect(response.statusCode).toEqual(404);
    expect(response.body).toHaveProperty("error");
    expect(response.body.error.message).toEqual(
      `There is no book with an isbn 0`
    );
  });
});

/** POST /   bookData => {book: newBook}  */
describe("POST /books - create book from data; return {book: book}", function () {
  test("Creates a single new book", async function () {
    const testBook = {
      isbn: "789",
      amazon_url: "www.amazon/book3.com",
      author: "Test User",
      language: "English",
      pages: 21,
      publisher: "Test Publisher",
      title: "Book of Tests",
      year: 2020,
    };
    const response = await request(app).post("/books").send(testBook);
    expect(response.statusCode).toEqual(201);
    expect(response.body).toEqual({ book: testBook });
  });
  test("Responds with 404 if data isn't valid", async function () {
    const failTestBook = {
      isbn: "789",
      author: "Test User",
      language: "English",
      pages: 21,
      publisher: "Test Publisher",
      title: "Book of Tests",
      year: 2020,
    };
    const response = await request(app).post("/books").send(failTestBook);
    expect(response.statusCode).toEqual(404);
    expect(response.body).toHaveProperty("error");
  });
});

describe("PUT /books - updates a single book", function () {
  test("Updates a single book", async function () {
    testBookOne = {
      isbn: "123321",
      amazon_url: "www.amazon/book3.com",
      author: "Test User1",
      language: "English",
      pages: 21,
      publisher: "Test Publisher",
      title: "Book of Tests",
      year: 2020,
    };
    const response = await request(app)
      .put(`/books/${testBookOne.isbn}`)
      .send(testBookOne);
    expect(response.statusCode).toEqual(200);
    expect(response.body).toEqual({ book: testBookOne });
  });
});

describe("DELETE /books/:isbn", function () {
  test("Deletes a single book", async function () {
    const response = await request(app).delete(`/books/${testBookOne.isbn}`);
    expect(response.statusCode).toEqual(200);
    expect(response.body).toHaveProperty("message");
    expect(response.body.message).toEqual("Book deleted");
  });
});
