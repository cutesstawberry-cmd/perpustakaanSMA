-- Add sample books for testing
-- This migration adds some sample books to test the catalog functionality

-- Insert sample books
INSERT INTO books (title, author, isbn, genre, publication_year, description, total_copies, available_copies) VALUES
  ('The Great Gatsby', 'F. Scott Fitzgerald', '978-0-7432-7356-5', 'Fiction', 1925, 'A classic American novel about the Jazz Age and the American Dream.', 3, 3),
  ('To Kill a Mockingbird', 'Harper Lee', '978-0-06-112008-4', 'Fiction', 1960, 'A gripping tale of racial injustice and childhood innocence in the American South.', 2, 2),
  ('1984', 'George Orwell', '978-0-452-28423-4', 'Fiction', 1949, 'A dystopian social science fiction novel about totalitarian control.', 4, 4),
  ('Pride and Prejudice', 'Jane Austen', '978-0-14-143951-8', 'Fiction', 1813, 'A romantic novel of manners written by Jane Austen.', 2, 2),
  ('The Catcher in the Rye', 'J.D. Salinger', '978-0-316-76948-0', 'Fiction', 1951, 'A coming-of-age story about teenage rebellion and alienation.', 3, 3),
  ('Introduction to Algorithms', 'Thomas H. Cormen', '978-0-262-03384-8', 'Technology', 2009, 'A comprehensive textbook on computer algorithms and data structures.', 2, 2),
  ('Clean Code', 'Robert C. Martin', '978-0-13-235088-4', 'Technology', 2008, 'A handbook of agile software craftsmanship.', 3, 3),
  ('The Art of Computer Programming', 'Donald E. Knuth', '978-0-201-89683-1', 'Technology', 1968, 'A comprehensive monograph written by Donald Knuth about computer programming.', 1, 1),
  ('A Brief History of Time', 'Stephen Hawking', '978-0-553-38016-3', 'Science', 1988, 'A popular-science book on cosmology by British physicist Stephen Hawking.', 2, 2),
  ('The Selfish Gene', 'Richard Dawkins', '978-0-19-286092-7', 'Science', 1976, 'A book on evolution by Richard Dawkins, in which Dawkins builds upon the principal theory of George C. Williams.', 2, 2),
  ('Sapiens', 'Yuval Noah Harari', '978-0-06-231609-7', 'History', 2011, 'A book by Yuval Noah Harari, first published in Hebrew in Israel in 2011.', 3, 3),
  ('The Diary of a Young Girl', 'Anne Frank', '978-0-553-29698-3', 'History', 1947, 'A book of the writings from the Dutch language diary kept by Anne Frank while she was in hiding.', 2, 2),
  ('The Elements of Style', 'William Strunk Jr.', '978-0-205-30902-3', 'Reference', 1918, 'A prescriptive American English writing style guide.', 4, 4),
  ('Oxford English Dictionary', 'Oxford University Press', '978-0-19-861186-8', 'Reference', 1884, 'The principal historical dictionary of the English language.', 1, 1),
  ('Harry Potter and the Philosopher''s Stone', 'J.K. Rowling', '978-0-7475-3269-9', 'Children', 1997, 'The first novel in the Harry Potter series.', 5, 5),
  ('The Lion, the Witch and the Wardrobe', 'C.S. Lewis', '978-0-06-447104-6', 'Children', 1950, 'A fantasy novel for children by C. S. Lewis.', 3, 3)
ON CONFLICT (isbn) DO NOTHING;

-- Display completion message
DO $$
BEGIN
  RAISE NOTICE 'Sample books added successfully!';
  RAISE NOTICE 'You can now test the book catalog functionality.';
  RAISE NOTICE 'Total books added: 16';
END $$;