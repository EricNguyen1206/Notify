import Link from "next/link"

function Error({ statusCode }: { statusCode: number }) {
  return (
    <div className="container mx-auto p-8 text-center">
      <div className="max-w-md mx-auto bg-white rounded-lg shadow-lg p-8">
        <h1 className="text-4xl font-bold text-red-500 mb-4">Error {statusCode}</h1>
        <p className="text-gray-600 text-lg mb-6">
          {statusCode
            ? `An error ${statusCode} occurred on server`
            : 'An error occurred on client'}
        </p>
        <Link 
          href="/"
          className="inline-block bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2 px-6 rounded-full transition-colors duration-200"
        >
          Go back to the home page
        </Link>
      </div>
    </div>
  )
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
Error.getInitialProps = ({ res, err }: { res: any, err: any }) => {
  const statusCode = res ? res.statusCode : err ? err.statusCode : 404
  return { statusCode }
}

export default Error