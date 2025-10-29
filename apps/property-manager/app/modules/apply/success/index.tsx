import Confetti from 'react-confetti'
import { Link } from 'react-router'
import { Button } from '~/components/ui/button'

export function ApplySuccessModule() {
    return (
        <>
            <Confetti className="h-full w-full" numberOfPieces={50} />
            <div className='flex flex-col h-lvh justify-center items-center'>
                <div className='md:w-5/12 mx-5'>

                    <div className="mb-10 text-6xl">🚀</div>
                    <h1 className="mb-2 text-2xl font-extrabold">
                        Your Application has been submitted!
                    </h1>
                    <p className='mt-5'>
                        Thank you for applying to be a property owner with us. We will
                        review your application and get back to you shortly. Keep an eye
                        on your email/phone text messages for updates.
                    </p>

                    <div className="mt-10">
                        <Link to="/login">
                            <Button size="lg">
                                Go Home
                            </Button>
                        </Link>
                    </div>
                </div>
            </div>
        </>
    )
}