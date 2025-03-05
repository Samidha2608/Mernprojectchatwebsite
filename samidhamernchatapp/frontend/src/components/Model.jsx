import React from 'react'

const Model = ({fn,selectedGroupData}) => {
  return (
     <>
        <dialog id="my_modal_3" className="modal">
          <div className="modal-box">
            <form method="dialog">
              {/* if there is a button in form, it will close the modal */}
              <button className="btn btn-sm btn-circle btn-ghost absolute right-2 top-2 ">✕</button>
            </form>
            <h3 className="font-bold text-2xl">Conformation!</h3>
            <p className="py-4 text-xl">Do You Want To Delete This Group {selectedGroupData?.name}?</p>
            <div className="modal-action">
              <button className="btn px-10 bg-red-500" onClick={()=>fn(selectedGroupData?._id)}>Yes</button>
            </div>
          </div>
        </dialog>
      </>
  )
}

export default Model