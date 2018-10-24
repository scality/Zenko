

def iter_chunk(itr, chunksize=10):
    chunk = []
    for i in itr:
        chunk.append(i)
        if len(chunk) == chunksize:
            yield chunk
            chunk = []
    if chunk:
        yield chunk
