export const getObjectById = (data,id) => {
    return data?.find(e => e.id == id) || "";
}