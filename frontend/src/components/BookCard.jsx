function BookCard({ book, onEdit }) {
  return (
    <article className="book-card">
      <div className="book-card-heading">
        <div>
          <h3>{book.title}</h3>
          <p className="book-author">by {book.author}</p>
        </div>
        <span className={book.availableCopies > 0 ? "availability available" : "availability unavailable"}>
          {book.availableCopies > 0 ? "Available" : "Checked out"}
        </span>
      </div>
      <dl className="book-details">
        <div><dt>Category</dt><dd>{book.category}</dd></div>
        <div><dt>ISBN</dt><dd>{book.isbn}</dd></div>
        <div><dt>Published</dt><dd>{book.publicationYear}</dd></div>
        <div><dt>Copies</dt><dd>{book.availableCopies} / {book.totalCopies}</dd></div>
      </dl>
      {onEdit && <button className="secondary-button" onClick={() => onEdit(book)}>Edit book</button>}
    </article>
  );
}

export default BookCard;
